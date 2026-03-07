const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

async function ensurePartyTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      leader_player_id INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS party_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      role TEXT DEFAULT 'Member',
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(party_id, player_id),
      UNIQUE(player_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS party_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_id INTEGER NOT NULL,
      from_player_id INTEGER NOT NULL,
      to_player_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      responded_at TEXT
    )
  `);

  saveDB();
}

async function getPlayerBasic(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, nickname, class, level
     FROM players
     WHERE id = ?`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const row = result[0].values[0];

  return {
    player_id: row[0],
    nickname: row[1],
    class: row[2],
    level: row[3]
  };
}

async function getPartyById(partyId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, leader_player_id, status, created_at
     FROM parties
     WHERE id = ?`,
    [Number(partyId)]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const row = result[0].values[0];

  return {
    party_id: row[0],
    leader_player_id: row[1],
    status: row[2],
    created_at: row[3]
  };
}

async function getPlayerParty(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT p.id, p.leader_player_id, p.status, p.created_at
     FROM party_members pm
     INNER JOIN parties p ON p.id = pm.party_id
     WHERE pm.player_id = ?
       AND p.status = 'active'`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const row = result[0].values[0];

  return {
    party_id: row[0],
    leader_player_id: row[1],
    status: row[2],
    created_at: row[3]
  };
}

async function createParty({ leaderPlayerId }) {
  const db = await initDB();

  const leader = await getPlayerBasic(leaderPlayerId);
  if (!leader) {
    throw new Error("leader player not found");
  }

  const existingParty = await getPlayerParty(leaderPlayerId);
  if (existingParty) {
    throw new Error("player already belongs to a party");
  }

  db.run(
    `INSERT INTO parties (
      leader_player_id,
      status,
      created_at
    ) VALUES (?, 'active', CURRENT_TIMESTAMP)`,
    [Number(leaderPlayerId)]
  );

  const created = db.exec(`
    SELECT id, leader_player_id, status, created_at
    FROM parties
    ORDER BY id DESC
    LIMIT 1
  `);

  const party = created[0].values[0];

  db.run(
    `INSERT INTO party_members (
      party_id,
      player_id,
      role,
      joined_at
    ) VALUES (?, ?, 'Leader', CURRENT_TIMESTAMP)`,
    [Number(party[0]), Number(leaderPlayerId)]
  );

  saveDB();

  await createEvent({
    eventType: "party_created",
    title: "Party Created",
    message: `👥 ${leader.nickname} created a party`,
    metadata: {
      party_id: Number(party[0]),
      leader_player_id: Number(leaderPlayerId)
    }
  });

  return {
    party_id: party[0],
    leader_player_id: party[1],
    status: party[2],
    created_at: party[3]
  };
}

async function inviteToParty({ partyId, fromPlayerId, toPlayerId }) {
  const db = await initDB();

  const party = await getPartyById(partyId);
  if (!party || party.status !== "active") {
    throw new Error("party not found");
  }

  const inviterMember = db.exec(
    `SELECT role
     FROM party_members
     WHERE party_id = ?
       AND player_id = ?`,
    [Number(partyId), Number(fromPlayerId)]
  );

  if (!inviterMember.length || !inviterMember[0].values.length) {
    throw new Error("inviter is not in this party");
  }

  const inviterRole = inviterMember[0].values[0][0];
  if (!["Leader", "Officer"].includes(String(inviterRole))) {
    throw new Error("inviter has no permission");
  }

  const target = await getPlayerBasic(toPlayerId);
  if (!target) {
    throw new Error("target player not found");
  }

  const targetParty = await getPlayerParty(toPlayerId);
  if (targetParty) {
    throw new Error("target player already belongs to a party");
  }

  const pending = db.exec(
    `SELECT id
     FROM party_invites
     WHERE party_id = ?
       AND to_player_id = ?
       AND status = 'pending'`,
    [Number(partyId), Number(toPlayerId)]
  );

  if (pending.length && pending[0].values.length) {
    throw new Error("invite already pending");
  }

  db.run(
    `INSERT INTO party_invites (
      party_id,
      from_player_id,
      to_player_id,
      status,
      created_at
    ) VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
    [Number(partyId), Number(fromPlayerId), Number(toPlayerId)]
  );

  saveDB();

  return {
    party_id: Number(partyId),
    from_player_id: Number(fromPlayerId),
    to_player_id: Number(toPlayerId),
    status: "pending"
  };
}

async function acceptPartyInvite({ inviteId, playerId }) {
  const db = await initDB();

  const inviteResult = db.exec(
    `SELECT id, party_id, from_player_id, to_player_id, status
     FROM party_invites
     WHERE id = ?`,
    [Number(inviteId)]
  );

  if (!inviteResult.length || !inviteResult[0].values.length) {
    throw new Error("invite not found");
  }

  const invite = inviteResult[0].values[0];

  if (Number(invite[3]) !== Number(playerId)) {
    throw new Error("invite does not belong to player");
  }

  if (String(invite[4]) !== "pending") {
    throw new Error("invite is not pending");
  }

  const existingParty = await getPlayerParty(playerId);
  if (existingParty) {
    throw new Error("player already belongs to a party");
  }

  const party = await getPartyById(invite[1]);
  if (!party || party.status !== "active") {
    throw new Error("party not found");
  }

  const countResult = db.exec(
    `SELECT COUNT(*)
     FROM party_members
     WHERE party_id = ?`,
    [Number(invite[1])]
  );

  const totalMembers = Number(countResult[0]?.values?.[0]?.[0] || 0);
  if (totalMembers >= 4) {
    throw new Error("party is full");
  }

  db.run(
    `INSERT INTO party_members (
      party_id,
      player_id,
      role,
      joined_at
    ) VALUES (?, ?, 'Member', CURRENT_TIMESTAMP)`,
    [Number(invite[1]), Number(playerId)]
  );

  db.run(
    `UPDATE party_invites
     SET status = 'accepted',
         responded_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [Number(inviteId)]
  );

  saveDB();

  const player = await getPlayerBasic(playerId);

  await createEvent({
    eventType: "party_joined",
    title: "Party Member Joined",
    message: `🤝 ${player?.nickname || `Player ${playerId}`} joined a party`,
    metadata: {
      party_id: Number(invite[1]),
      player_id: Number(playerId)
    }
  });

  return {
    invite_id: Number(inviteId),
    party_id: Number(invite[1]),
    player_id: Number(playerId),
    status: "accepted"
  };
}

async function getPartyDetailsByPlayer(playerId) {
  const db = await initDB();

  const party = await getPlayerParty(playerId);
  if (!party) {
    throw new Error("player is not in a party");
  }

  const membersResult = db.exec(
    `SELECT pm.id, pm.player_id, p.nickname, p.class, p.level, pm.role, pm.joined_at
     FROM party_members pm
     INNER JOIN players p ON p.id = pm.player_id
     WHERE pm.party_id = ?
     ORDER BY
       CASE pm.role
         WHEN 'Leader' THEN 1
         WHEN 'Officer' THEN 2
         ELSE 3
       END,
       pm.id ASC`,
    [Number(party.party_id)]
  );

  const members = !membersResult.length
    ? []
    : membersResult[0].values.map((row) => ({
        member_id: row[0],
        player_id: row[1],
        nickname: row[2],
        class: row[3],
        level: row[4],
        role: row[5],
        joined_at: row[6]
      }));

  return {
    party,
    total_members: members.length,
    members
  };
}

async function leaveParty({ playerId }) {
  const db = await initDB();

  const party = await getPlayerParty(playerId);
  if (!party) {
    throw new Error("player is not in a party");
  }

  const memberResult = db.exec(
    `SELECT role
     FROM party_members
     WHERE party_id = ?
       AND player_id = ?`,
    [Number(party.party_id), Number(playerId)]
  );

  const role = memberResult[0].values[0][0];

  db.run(
    `DELETE FROM party_members
     WHERE party_id = ?
       AND player_id = ?`,
    [Number(party.party_id), Number(playerId)]
  );

  const remaining = db.exec(
    `SELECT player_id, role
     FROM party_members
     WHERE party_id = ?
     ORDER BY id ASC`,
    [Number(party.party_id)]
  );

  if (!remaining.length || !remaining[0].values.length) {
    db.run(
      `UPDATE parties
       SET status = 'closed'
       WHERE id = ?`,
      [Number(party.party_id)]
    );
  } else if (String(role) === "Leader") {
    const newLeaderId = remaining[0].values[0][0];

    db.run(
      `UPDATE parties
       SET leader_player_id = ?
       WHERE id = ?`,
      [Number(newLeaderId), Number(party.party_id)]
    );

    db.run(
      `UPDATE party_members
       SET role = 'Leader'
       WHERE party_id = ?
         AND player_id = ?`,
      [Number(party.party_id), Number(newLeaderId)]
    );
  }

  saveDB();

  return {
    player_id: Number(playerId),
    party_id: Number(party.party_id),
    left: true
  };
}

async function kickPartyMember({ actorPlayerId, targetPlayerId }) {
  const db = await initDB();

  const actorParty = await getPlayerParty(actorPlayerId);
  if (!actorParty) {
    throw new Error("actor is not in a party");
  }

  const targetParty = await getPlayerParty(targetPlayerId);
  if (!targetParty || Number(targetParty.party_id) !== Number(actorParty.party_id)) {
    throw new Error("target is not in the same party");
  }

  const actorMember = db.exec(
    `SELECT role
     FROM party_members
     WHERE party_id = ?
       AND player_id = ?`,
    [Number(actorParty.party_id), Number(actorPlayerId)]
  );

  const targetMember = db.exec(
    `SELECT role
     FROM party_members
     WHERE party_id = ?
       AND player_id = ?`,
    [Number(actorParty.party_id), Number(targetPlayerId)]
  );

  const actorRole = actorMember[0].values[0][0];
  const targetRole = targetMember[0].values[0][0];

  if (!["Leader", "Officer"].includes(String(actorRole))) {
    throw new Error("actor has no permission");
  }

  if (String(targetRole) === "Leader") {
    throw new Error("cannot kick the leader");
  }

  if (String(actorRole) === "Officer" && String(targetRole) === "Officer") {
    throw new Error("officer cannot kick another officer");
  }

  db.run(
    `DELETE FROM party_members
     WHERE party_id = ?
       AND player_id = ?`,
    [Number(actorParty.party_id), Number(targetPlayerId)]
  );

  saveDB();

  return {
    party_id: Number(actorParty.party_id),
    target_player_id: Number(targetPlayerId),
    removed: true
  };
}

module.exports = {
  ensurePartyTables,
  createParty,
  inviteToParty,
  acceptPartyInvite,
  getPartyDetailsByPlayer,
  leaveParty,
  kickPartyMember
};
