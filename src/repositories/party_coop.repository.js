const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");
const { getPlayerCombatProfile } = require("./combat_core.repository");

async function ensurePartyCoopTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS party_dungeons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_id INTEGER NOT NULL,
      dungeon_id INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      progress_stage INTEGER DEFAULT 1,
      mobs_remaining INTEGER DEFAULT 8,
      boss_spawned INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      total_gold_earned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      finished_at TEXT,
      UNIQUE(party_id, status)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS party_dungeon_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_dungeon_id INTEGER NOT NULL,
      party_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      xp_earned INTEGER DEFAULT 0,
      gold_earned INTEGER DEFAULT 0,
      UNIQUE(party_dungeon_id, player_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS party_loot_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      party_id INTEGER NOT NULL,
      party_dungeon_id INTEGER,
      source_type TEXT NOT NULL,
      source_id INTEGER,
      player_id INTEGER,
      loot_type TEXT NOT NULL,
      loot_name TEXT NOT NULL,
      amount INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function getPartyById(partyId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, leader_player_id, status, created_at
     FROM parties
     WHERE id = ?`,
    [Number(partyId)]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];

  return {
    party_id: row[0],
    leader_player_id: row[1],
    status: row[2],
    created_at: row[3]
  };
}

async function getPartyMembers(partyId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT pm.player_id, p.nickname, p.class, p.level, pm.role
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
    [Number(partyId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    player_id: row[0],
    nickname: row[1],
    class: row[2],
    level: row[3],
    role: row[4]
  }));
}

async function getDungeonById(dungeonId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, dungeon_name, min_level, recommended_power, energy_cost, base_gold, boss_name
     FROM dungeons
     WHERE id = ?`,
    [Number(dungeonId)]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];

  return {
    dungeon_id: row[0],
    dungeon_name: row[1],
    min_level: row[2],
    recommended_power: row[3],
    energy_cost: row[4],
    base_gold: row[5],
    boss_name: row[6]
  };
}

async function getActivePartyDungeon(partyId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, party_id, dungeon_id, status, progress_stage, mobs_remaining, boss_spawned,
            completed, total_gold_earned, created_at, updated_at, finished_at
     FROM party_dungeons
     WHERE party_id = ?
       AND status = 'active'
     ORDER BY id DESC
     LIMIT 1`,
    [Number(partyId)]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];

  return {
    party_dungeon_id: row[0],
    party_id: row[1],
    dungeon_id: row[2],
    status: row[3],
    progress_stage: row[4],
    mobs_remaining: row[5],
    boss_spawned: Boolean(row[6]),
    completed: Boolean(row[7]),
    total_gold_earned: row[8],
    created_at: row[9],
    updated_at: row[10],
    finished_at: row[11]
  };
}

function randomPartyLoot() {
  const roll = Math.random() * 100;

  if (roll <= 10) {
    return { loot_type: "crystal", loot_name: "Party Rare Mana Crystal", amount: 1, gold_bonus: 400, xp_bonus: 80 };
  }

  if (roll <= 35) {
    return { loot_type: "crystal", loot_name: "Party Common Mana Crystal", amount: 2, gold_bonus: 180, xp_bonus: 45 };
  }

  if (roll <= 60) {
    return { loot_type: "gold", loot_name: "Party Dungeon Gold", amount: 300, gold_bonus: 300, xp_bonus: 35 };
  }

  if (roll <= 80) {
    return { loot_type: "material", loot_name: "Party Forge Fragment", amount: 1, gold_bonus: 160, xp_bonus: 40 };
  }

  return { loot_type: "gold", loot_name: "Party Dungeon Gold", amount: 150, gold_bonus: 150, xp_bonus: 30 };
}

async function startPartyDungeon({ partyId, dungeonId, actorPlayerId }) {
  const db = await initDB();

  const party = await getPartyById(partyId);
  if (!party || party.status !== "active") {
    throw new Error("party not found");
  }

  if (Number(party.leader_player_id) !== Number(actorPlayerId)) {
    throw new Error("only party leader can start party dungeon");
  }

  const active = await getActivePartyDungeon(partyId);
  if (active) {
    throw new Error("party already has an active dungeon");
  }

  const dungeon = await getDungeonById(dungeonId);
  if (!dungeon) {
    throw new Error("dungeon not found");
  }

  const members = await getPartyMembers(partyId);
  if (!members.length) {
    throw new Error("party has no members");
  }

  const tooLow = members.find((member) => Number(member.level) < Number(dungeon.min_level));
  if (tooLow) {
    throw new Error(`party member ${tooLow.nickname} is below dungeon minimum level`);
  }

  db.run(
    `INSERT INTO party_dungeons (
      party_id,
      dungeon_id,
      status,
      progress_stage,
      mobs_remaining,
      boss_spawned,
      completed,
      total_gold_earned,
      created_at,
      updated_at
    ) VALUES (?, ?, 'active', 1, 8, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [Number(partyId), Number(dungeonId)]
  );

  const created = db.exec(`
    SELECT id
    FROM party_dungeons
    ORDER BY id DESC
    LIMIT 1
  `);

  const partyDungeonId = created[0].values[0][0];

  for (const member of members) {
    db.run(
      `INSERT INTO party_dungeon_members (
        party_dungeon_id,
        party_id,
        player_id,
        joined_at,
        xp_earned,
        gold_earned
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, 0, 0)`,
      [Number(partyDungeonId), Number(partyId), Number(member.player_id)]
    );
  }

  saveDB();

  await createEvent({
    eventType: "party_dungeon_started",
    title: "Party Dungeon Started",
    message: `⚔️ Party ${partyId} entered ${dungeon.dungeon_name}`,
    metadata: {
      party_id: Number(partyId),
      dungeon_id: Number(dungeonId),
      party_dungeon_id: Number(partyDungeonId)
    }
  });

  return {
    party_dungeon_id: Number(partyDungeonId),
    party_id: Number(partyId),
    dungeon_id: Number(dungeonId),
    dungeon_name: dungeon.dungeon_name,
    total_members: members.length,
    status: "active"
  };
}

async function getPartyDungeonStatus(partyId) {
  const db = await initDB();

  const active = await getActivePartyDungeon(partyId);
  if (!active) {
    throw new Error("active party dungeon not found");
  }

  const dungeon = await getDungeonById(active.dungeon_id);

  const membersResult = db.exec(
    `SELECT pdm.player_id, p.nickname, p.class, p.level, pdm.xp_earned, pdm.gold_earned
     FROM party_dungeon_members pdm
     INNER JOIN players p ON p.id = pdm.player_id
     WHERE pdm.party_dungeon_id = ?
     ORDER BY pdm.id ASC`,
    [Number(active.party_dungeon_id)]
  );

  const members = !membersResult.length
    ? []
    : membersResult[0].values.map((row) => ({
        player_id: row[0],
        nickname: row[1],
        class: row[2],
        level: row[3],
        xp_earned: row[4],
        gold_earned: row[5]
      }));

  return {
    ...active,
    dungeon_name: dungeon?.dungeon_name || null,
    boss_name: dungeon?.boss_name || null,
    members
  };
}

async function gainXpToPlayer(playerId, xpAmount) {
  const db = await initDB();

  const playerResult = db.exec(
    `SELECT id, level, xp
     FROM players
     WHERE id = ?`,
    [Number(playerId)]
  );

  if (!playerResult.length || !playerResult[0].values.length) return;

  let level = Number(playerResult[0].values[0][1]);
  let xp = Number(playerResult[0].values[0][2]) + Number(xpAmount || 0);
  let statPoints = 0;

  function xpNeededForNextLevel(currentLevel) {
    return currentLevel * 100;
  }

  while (xp >= xpNeededForNextLevel(level)) {
    xp -= xpNeededForNextLevel(level);
    level += 1;
    statPoints += 5;
  }

  db.run(
    `UPDATE players
     SET level = ?, xp = ?
     WHERE id = ?`,
    [level, xp, Number(playerId)]
  );

  if (statPoints > 0) {
    db.run(
      `UPDATE character_progression
       SET stat_points = stat_points + ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE player_id = ?`,
      [statPoints, Number(playerId)]
    );
  }
}

async function progressPartyDungeon({ partyId, actorPlayerId }) {
  const db = await initDB();

  const party = await getPartyById(partyId);
  if (!party || party.status !== "active") {
    throw new Error("party not found");
  }

  const memberCheck = db.exec(
    `SELECT id
     FROM party_members
     WHERE party_id = ?
       AND player_id = ?`,
    [Number(partyId), Number(actorPlayerId)]
  );

  if (!memberCheck.length || !memberCheck[0].values.length) {
    throw new Error("actor is not in this party");
  }

  const active = await getActivePartyDungeon(partyId);
  if (!active) {
    throw new Error("active party dungeon not found");
  }

  const members = await getPartyMembers(partyId);
  if (!members.length) {
    throw new Error("party has no members");
  }

  let totalPartyPower = 0;
  for (const member of members) {
    try {
      const profile = await getPlayerCombatProfile(member.player_id);
      totalPartyPower += Number(profile.final_stats.attack_power || 0)
        + Number(profile.final_stats.magic_power || 0)
        + Number(profile.final_stats.defense || 0);
    } catch {
      totalPartyPower += 50;
    }
  }

  const loot = randomPartyLoot();

  const xpPerMember = Math.max(20, Math.floor((loot.xp_bonus + totalPartyPower / 20) / members.length));
  const goldPerMember = Math.max(50, Math.floor((loot.gold_bonus + totalPartyPower / 15) / members.length));

  let mobsRemaining = Number(active.mobs_remaining);
  let bossSpawned = Boolean(active.boss_spawned);
  let progressStage = Number(active.progress_stage);
  let totalGoldEarned = Number(active.total_gold_earned) + goldPerMember * members.length;

  if (!bossSpawned) {
    const clearPower = Math.max(1, Math.floor(totalPartyPower / 220));
    mobsRemaining -= clearPower;

    if (mobsRemaining <= 0) {
      mobsRemaining = 0;
      bossSpawned = true;
      progressStage = 2;
    }
  } else {
    progressStage = 3;
  }

  const completed = progressStage >= 3 ? 1 : 0;
  const newStatus = completed ? "completed" : "active";

  for (const member of members) {
    db.run(
      `UPDATE currencies
       SET gold = gold + ?
       WHERE player_id = ?`,
      [Number(goldPerMember), Number(member.player_id)]
    );

    await gainXpToPlayer(member.player_id, xpPerMember);

    db.run(
      `UPDATE party_dungeon_members
       SET xp_earned = xp_earned + ?,
           gold_earned = gold_earned + ?
       WHERE party_dungeon_id = ?
         AND player_id = ?`,
      [Number(xpPerMember), Number(goldPerMember), Number(active.party_dungeon_id), Number(member.player_id)]
    );

    db.run(
      `INSERT INTO party_loot_log (
        party_id,
        party_dungeon_id,
        source_type,
        source_id,
        player_id,
        loot_type,
        loot_name,
        amount,
        created_at
      ) VALUES (?, ?, 'party_dungeon', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        Number(partyId),
        Number(active.party_dungeon_id),
        Number(active.party_dungeon_id),
        Number(member.player_id),
        String(loot.loot_type),
        String(loot.loot_name),
        Number(loot.amount)
      ]
    );
  }

  db.run(
    `UPDATE party_dungeons
     SET progress_stage = ?,
         mobs_remaining = ?,
         boss_spawned = ?,
         completed = ?,
         total_gold_earned = ?,
         status = ?,
         updated_at = CURRENT_TIMESTAMP,
         finished_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE finished_at END
     WHERE id = ?`,
    [
      Number(progressStage),
      Number(mobsRemaining),
      bossSpawned ? 1 : 0,
      completed,
      Number(totalGoldEarned),
      String(newStatus),
      completed,
      Number(active.party_dungeon_id)
    ]
  );

  saveDB();

  if (completed) {
    await createEvent({
      eventType: "party_dungeon_completed",
      title: "Party Dungeon Completed",
      message: `🏆 Party ${partyId} completed the dungeon`,
      metadata: {
        party_id: Number(partyId),
        party_dungeon_id: Number(active.party_dungeon_id)
      }
    });
  }

  return {
    party_id: Number(partyId),
    party_dungeon_id: Number(active.party_dungeon_id),
    loot,
    xp_per_member: xpPerMember,
    gold_per_member: goldPerMember,
    progress_stage: Number(progressStage),
    mobs_remaining: Number(mobsRemaining),
    boss_spawned: bossSpawned,
    completed: Boolean(completed),
    total_gold_earned: Number(totalGoldEarned)
  };
}

async function getPartyLoot(partyId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, party_id, party_dungeon_id, source_type, source_id, player_id, loot_type, loot_name, amount, created_at
     FROM party_loot_log
     WHERE party_id = ?
     ORDER BY id DESC`,
    [Number(partyId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    loot_id: row[0],
    party_id: row[1],
    party_dungeon_id: row[2],
    source_type: row[3],
    source_id: row[4],
    player_id: row[5],
    loot_type: row[6],
    loot_name: row[7],
    amount: row[8],
    created_at: row[9]
  }));
}

async function partyRaidAttack({ partyId, actorPlayerId, skillUsed = null }) {
  const db = await initDB();

  const party = await getPartyById(partyId);
  if (!party || party.status !== "active") {
    throw new Error("party not found");
  }

  const actorCheck = db.exec(
    `SELECT id
     FROM party_members
     WHERE party_id = ?
       AND player_id = ?`,
    [Number(partyId), Number(actorPlayerId)]
  );

  if (!actorCheck.length || !actorCheck[0].values.length) {
    throw new Error("actor is not in this party");
  }

  const bossResult = db.exec(
    `SELECT id, boss_name, current_hp, status
     FROM world_bosses
     WHERE status = 'active'
     ORDER BY id DESC
     LIMIT 1`
  );

  if (!bossResult.length || !bossResult[0].values.length) {
    throw new Error("no active world boss");
  }

  const boss = bossResult[0].values[0];
  const bossId = Number(boss[0]);
  const currentHp = Number(boss[2]);

  const members = await getPartyMembers(partyId);
  if (!members.length) {
    throw new Error("party has no members");
  }

  let totalDamage = 0;

  for (const member of members) {
    const participant = db.exec(
      `SELECT id
       FROM boss_participants
       WHERE boss_id = ?
         AND player_id = ?`,
      [bossId, Number(member.player_id)]
    );

    if (!participant.length || !participant[0].values.length) {
      continue;
    }

    let memberDamage = 30;

    try {
      const profile = await getPlayerCombatProfile(member.player_id);
      memberDamage =
        Math.floor(
          Number(profile.final_stats.attack_power || 0) +
          Number(profile.final_stats.magic_power || 0) / 2
        );
    } catch {
      memberDamage = 30;
    }

    if (skillUsed && Number(member.player_id) === Number(actorPlayerId)) {
      memberDamage += 20;
    }

    totalDamage += memberDamage;

    db.run(
      `INSERT INTO boss_damage_log (
        boss_id,
        player_id,
        damage,
        skill_used,
        created_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        bossId,
        Number(member.player_id),
        Number(memberDamage),
        skillUsed && Number(member.player_id) === Number(actorPlayerId) ? String(skillUsed) : null
      ]
    );

    db.run(
      `UPDATE boss_participants
       SET total_damage = total_damage + ?
       WHERE boss_id = ?
         AND player_id = ?`,
      [Number(memberDamage), bossId, Number(member.player_id)]
    );
  }

  const appliedDamage = Math.min(currentHp, totalDamage);
  const newHp = currentHp - appliedDamage;

  db.run(
    `UPDATE world_bosses
     SET current_hp = ?
     WHERE id = ?`,
    [Number(newHp), bossId]
  );

  if (newHp <= 0) {
    db.run(
      `UPDATE world_bosses
       SET status = 'defeated',
           current_hp = 0,
           winner_player_id = ?,
           ended_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [Number(actorPlayerId), bossId]
    );
  }

  saveDB();

  return {
    party_id: Number(partyId),
    boss_id: bossId,
    boss_name: boss[1],
    damage: Number(appliedDamage),
    current_hp: Math.max(0, Number(newHp)),
    defeated: newHp <= 0
  };
}

module.exports = {
  ensurePartyCoopTables,
  startPartyDungeon,
  progressPartyDungeon,
  getPartyDungeonStatus,
  getPartyLoot,
  partyRaidAttack
};
