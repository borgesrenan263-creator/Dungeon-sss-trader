const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

async function ensureGuildFullTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS guild_storage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id INTEGER UNIQUE NOT NULL,
      gold INTEGER DEFAULT 0,
      obsidian INTEGER DEFAULT 0,
      usdt INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function getGuildById(guildId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, guild_name, guild_tag, leader_player_id, created_at
     FROM guilds
     WHERE id = ?`,
    [Number(guildId)]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const row = result[0].values[0];

  return {
    guild_id: row[0],
    guild_name: row[1],
    guild_tag: row[2],
    leader_player_id: row[3],
    created_at: row[4]
  };
}

async function getGuildMember(guildId, playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, guild_id, player_id, role, joined_at
     FROM guild_members
     WHERE guild_id = ?
       AND player_id = ?`,
    [Number(guildId), Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const row = result[0].values[0];

  return {
    member_id: row[0],
    guild_id: row[1],
    player_id: row[2],
    role: row[3],
    joined_at: row[4]
  };
}

async function getPlayerGuild(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT gm.guild_id, g.guild_name, g.guild_tag, gm.role
     FROM guild_members gm
     INNER JOIN guilds g ON g.id = gm.guild_id
     WHERE gm.player_id = ?`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const row = result[0].values[0];

  return {
    guild_id: row[0],
    guild_name: row[1],
    guild_tag: row[2],
    role: row[3]
  };
}

async function ensureGuildStorage(guildId) {
  const db = await initDB();

  const existing = db.exec(
    `SELECT id
     FROM guild_storage
     WHERE guild_id = ?`,
    [Number(guildId)]
  );

  if (!existing.length || !existing[0].values.length) {
    db.run(
      `INSERT INTO guild_storage (
        guild_id,
        gold,
        obsidian,
        usdt,
        updated_at
      ) VALUES (?, 0, 0, 0, CURRENT_TIMESTAMP)`,
      [Number(guildId)]
    );

    saveDB();
  }
}

async function createGuildFull({ leaderPlayerId, guildName, guildTag }) {
  const db = await initDB();

  const player = db.exec(
    `SELECT id, nickname
     FROM players
     WHERE id = ?`,
    [Number(leaderPlayerId)]
  );

  if (!player.length || !player[0].values.length) {
    throw new Error("leader player not found");
  }

  const nickname = player[0].values[0][1];

  const existingGuild = await getPlayerGuild(leaderPlayerId);
  if (existingGuild) {
    throw new Error("player already belongs to a guild");
  }

  const sameName = db.exec(
    `SELECT id FROM guilds WHERE guild_name = ?`,
    [String(guildName)]
  );

  if (sameName.length && sameName[0].values.length) {
    throw new Error("guild name already exists");
  }

  const sameTag = db.exec(
    `SELECT id FROM guilds WHERE guild_tag = ?`,
    [String(guildTag)]
  );

  if (sameTag.length && sameTag[0].values.length) {
    throw new Error("guild tag already exists");
  }

  db.run(
    `INSERT INTO guilds (
      guild_name,
      guild_tag,
      leader_player_id,
      created_at
    ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    [String(guildName), String(guildTag), Number(leaderPlayerId)]
  );

  const created = db.exec(`
    SELECT id, guild_name, guild_tag, leader_player_id, created_at
    FROM guilds
    ORDER BY id DESC
    LIMIT 1
  `);

  const guild = created[0].values[0];

  db.run(
    `INSERT INTO guild_members (
      guild_id,
      player_id,
      role,
      joined_at
    ) VALUES (?, ?, 'Leader', CURRENT_TIMESTAMP)`,
    [Number(guild[0]), Number(leaderPlayerId)]
  );

  saveDB();

  await ensureGuildStorage(guild[0]);

  await createEvent({
    eventType: "guild_created_full",
    title: "Guild Created",
    message: `🛡️ ${nickname} created guild ${guild[1]} [${guild[2]}]`,
    metadata: {
      guild_id: Number(guild[0]),
      leader_player_id: Number(leaderPlayerId)
    }
  });

  return {
    guild_id: guild[0],
    guild_name: guild[1],
    guild_tag: guild[2],
    leader_player_id: guild[3],
    created_at: guild[4]
  };
}

async function joinGuildFull({ guildId, playerId }) {
  const db = await initDB();

  const guild = await getGuildById(guildId);
  if (!guild) {
    throw new Error("guild not found");
  }

  const player = db.exec(
    `SELECT id, nickname
     FROM players
     WHERE id = ?`,
    [Number(playerId)]
  );

  if (!player.length || !player[0].values.length) {
    throw new Error("player not found");
  }

  const nickname = player[0].values[0][1];

  const existingGuild = await getPlayerGuild(playerId);
  if (existingGuild) {
    throw new Error("player already belongs to a guild");
  }

  db.run(
    `INSERT INTO guild_members (
      guild_id,
      player_id,
      role,
      joined_at
    ) VALUES (?, ?, 'Member', CURRENT_TIMESTAMP)`,
    [Number(guildId), Number(playerId)]
  );

  saveDB();

  await createEvent({
    eventType: "guild_member_join_full",
    title: "Guild Member Joined",
    message: `👥 ${nickname} joined ${guild.guild_name} [${guild.guild_tag}]`,
    metadata: {
      guild_id: Number(guildId),
      player_id: Number(playerId)
    }
  });

  return {
    guild_id: Number(guildId),
    player_id: Number(playerId),
    role: "Member"
  };
}

async function promoteGuildMember({ guildId, actorPlayerId, targetPlayerId, newRole }) {
  const db = await initDB();

  const allowedRoles = ["Officer", "Member"];
  if (!allowedRoles.includes(String(newRole))) {
    throw new Error("invalid role");
  }

  const actor = await getGuildMember(guildId, actorPlayerId);
  if (!actor) {
    throw new Error("actor is not in this guild");
  }

  if (String(actor.role) !== "Leader") {
    throw new Error("only guild leader can promote members");
  }

  const target = await getGuildMember(guildId, targetPlayerId);
  if (!target) {
    throw new Error("target player is not in this guild");
  }

  if (String(target.role) === "Leader") {
    throw new Error("cannot change leader role here");
  }

  db.run(
    `UPDATE guild_members
     SET role = ?
     WHERE guild_id = ?
       AND player_id = ?`,
    [String(newRole), Number(guildId), Number(targetPlayerId)]
  );

  saveDB();

  return {
    guild_id: Number(guildId),
    player_id: Number(targetPlayerId),
    new_role: String(newRole)
  };
}

async function kickGuildMember({ guildId, actorPlayerId, targetPlayerId }) {
  const db = await initDB();

  const actor = await getGuildMember(guildId, actorPlayerId);
  if (!actor) {
    throw new Error("actor is not in this guild");
  }

  if (!["Leader", "Officer"].includes(String(actor.role))) {
    throw new Error("actor has no permission to kick members");
  }

  const target = await getGuildMember(guildId, targetPlayerId);
  if (!target) {
    throw new Error("target player is not in this guild");
  }

  if (String(target.role) === "Leader") {
    throw new Error("leader cannot be kicked");
  }

  if (String(actor.role) === "Officer" && String(target.role) === "Officer") {
    throw new Error("officer cannot kick another officer");
  }

  db.run(
    `DELETE FROM guild_members
     WHERE guild_id = ?
       AND player_id = ?`,
    [Number(guildId), Number(targetPlayerId)]
  );

  saveDB();

  return {
    guild_id: Number(guildId),
    player_id: Number(targetPlayerId),
    removed: true
  };
}

async function getGuildStorage(guildId) {
  const db = await initDB();

  await ensureGuildStorage(guildId);

  const result = db.exec(
    `SELECT guild_id, gold, obsidian, usdt, updated_at
     FROM guild_storage
     WHERE guild_id = ?`,
    [Number(guildId)]
  );

  const row = result[0].values[0];

  return {
    guild_id: row[0],
    gold: row[1],
    obsidian: row[2],
    usdt: row[3],
    updated_at: row[4]
  };
}

async function depositGuildGold({ guildId, playerId, goldAmount }) {
  const db = await initDB();

  const safeGold = Number(goldAmount) || 0;
  if (safeGold <= 0) {
    throw new Error("invalid gold amount");
  }

  const member = await getGuildMember(guildId, playerId);
  if (!member) {
    throw new Error("player is not in this guild");
  }

  const wallet = db.exec(
    `SELECT gold
     FROM currencies
     WHERE player_id = ?`,
    [Number(playerId)]
  );

  if (!wallet.length || !wallet[0].values.length) {
    throw new Error("player wallet not found");
  }

  const playerGold = Number(wallet[0].values[0][0] || 0);
  if (playerGold < safeGold) {
    throw new Error("insufficient gold");
  }

  await ensureGuildStorage(guildId);

  db.run(
    `UPDATE currencies
     SET gold = gold - ?
     WHERE player_id = ?`,
    [safeGold, Number(playerId)]
  );

  db.run(
    `UPDATE guild_storage
     SET gold = gold + ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE guild_id = ?`,
    [safeGold, Number(guildId)]
  );

  saveDB();

  return await getGuildStorage(guildId);
}

async function withdrawGuildGold({ guildId, playerId, goldAmount }) {
  const db = await initDB();

  const safeGold = Number(goldAmount) || 0;
  if (safeGold <= 0) {
    throw new Error("invalid gold amount");
  }

  const member = await getGuildMember(guildId, playerId);
  if (!member) {
    throw new Error("player is not in this guild");
  }

  if (!["Leader", "Officer"].includes(String(member.role))) {
    throw new Error("insufficient permission");
  }

  await ensureGuildStorage(guildId);

  const storage = await getGuildStorage(guildId);
  if (Number(storage.gold) < safeGold) {
    throw new Error("guild storage has insufficient gold");
  }

  db.run(
    `UPDATE guild_storage
     SET gold = gold - ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE guild_id = ?`,
    [safeGold, Number(guildId)]
  );

  db.run(
    `UPDATE currencies
     SET gold = gold + ?
     WHERE player_id = ?`,
    [safeGold, Number(playerId)]
  );

  saveDB();

  return await getGuildStorage(guildId);
}

async function getGuildDetails(guildId) {
  const db = await initDB();

  const guild = await getGuildById(guildId);
  if (!guild) {
    throw new Error("guild not found");
  }

  await ensureGuildStorage(guildId);
  const storage = await getGuildStorage(guildId);

  const membersResult = db.exec(
    `SELECT gm.id, gm.player_id, p.nickname, p.class, p.level, gm.role, gm.joined_at
     FROM guild_members gm
     INNER JOIN players p ON p.id = gm.player_id
     WHERE gm.guild_id = ?
     ORDER BY
       CASE gm.role
         WHEN 'Leader' THEN 1
         WHEN 'Officer' THEN 2
         ELSE 3
       END,
       gm.id ASC`,
    [Number(guildId)]
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

  const totalLevel = members.reduce((sum, member) => sum + Number(member.level || 0), 0);

  return {
    guild,
    storage,
    total_members: members.length,
    average_level: members.length ? Number((totalLevel / members.length).toFixed(2)) : 0,
    members
  };
}

async function getGuildRanking() {
  const db = await initDB();

  const guildsResult = db.exec(`
    SELECT g.id, g.guild_name, g.guild_tag, g.leader_player_id, g.created_at
    FROM guilds g
    ORDER BY g.id ASC
  `);

  if (!guildsResult.length) {
    return [];
  }

  const ranking = [];

  for (const row of guildsResult[0].values) {
    const guildId = Number(row[0]);

    const membersCount = db.exec(
      `SELECT COUNT(*) FROM guild_members WHERE guild_id = ?`,
      [guildId]
    );

    const avgLevel = db.exec(
      `SELECT AVG(p.level)
       FROM guild_members gm
       INNER JOIN players p ON p.id = gm.player_id
       WHERE gm.guild_id = ?`,
      [guildId]
    );

    const storage = await getGuildStorage(guildId);

    ranking.push({
      guild_id: guildId,
      guild_name: row[1],
      guild_tag: row[2],
      leader_player_id: row[3],
      total_members: Number(membersCount[0]?.values?.[0]?.[0] || 0),
      average_level: Number(Number(avgLevel[0]?.values?.[0]?.[0] || 0).toFixed(2)),
      guild_gold: Number(storage.gold || 0),
      created_at: row[4]
    });
  }

  ranking.sort((a, b) => {
    if (b.total_members !== a.total_members) return b.total_members - a.total_members;
    if (b.average_level !== a.average_level) return b.average_level - a.average_level;
    return b.guild_gold - a.guild_gold;
  });

  return ranking.map((guild, index) => ({
    rank: index + 1,
    ...guild
  }));
}

module.exports = {
  ensureGuildFullTables,
  createGuildFull,
  joinGuildFull,
  promoteGuildMember,
  kickGuildMember,
  getGuildDetails,
  getGuildRanking,
  getGuildStorage,
  depositGuildGold,
  withdrawGuildGold
};
