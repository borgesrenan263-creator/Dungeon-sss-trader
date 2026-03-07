const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

const DUNGEONS = [
  {
    dungeon_key: "shadow_den",
    dungeon_name: "Shadow Den",
    min_level: 1,
    recommended_power: 100,
    energy_cost: 1,
    base_gold: 200,
    boss_name: "Shadow Alpha"
  },
  {
    dungeon_key: "ancient_crypt",
    dungeon_name: "Ancient Crypt",
    min_level: 50,
    recommended_power: 260,
    energy_cost: 1,
    base_gold: 600,
    boss_name: "Crypt Warden"
  },
  {
    dungeon_key: "crimson_pit",
    dungeon_name: "Crimson Pit",
    min_level: 100,
    recommended_power: 500,
    energy_cost: 1,
    base_gold: 1200,
    boss_name: "Crimson Reaper"
  }
];

async function ensureDungeonTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS dungeons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dungeon_key TEXT UNIQUE NOT NULL,
      dungeon_name TEXT NOT NULL,
      min_level INTEGER NOT NULL,
      recommended_power INTEGER NOT NULL,
      energy_cost INTEGER DEFAULT 1,
      base_gold INTEGER DEFAULT 0,
      boss_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dungeon_instances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      dungeon_id INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      progress_stage INTEGER DEFAULT 1,
      mobs_remaining INTEGER DEFAULT 5,
      boss_spawned INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      total_gold_earned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      finished_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dungeon_loot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      instance_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      loot_type TEXT NOT NULL,
      loot_name TEXT NOT NULL,
      amount INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function seedDungeons() {
  const db = await initDB();

  for (const dungeon of DUNGEONS) {
    const existing = db.exec(
      `SELECT id FROM dungeons WHERE dungeon_key = ?`,
      [dungeon.dungeon_key]
    );

    if (existing.length && existing[0].values.length) continue;

    db.run(
      `INSERT INTO dungeons (
        dungeon_key,
        dungeon_name,
        min_level,
        recommended_power,
        energy_cost,
        base_gold,
        boss_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        dungeon.dungeon_key,
        dungeon.dungeon_name,
        dungeon.min_level,
        dungeon.recommended_power,
        dungeon.energy_cost,
        dungeon.base_gold,
        dungeon.boss_name
      ]
    );
  }

  saveDB();
}

async function listDungeons() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id, dungeon_key, dungeon_name, min_level, recommended_power, energy_cost, base_gold, boss_name
    FROM dungeons
    ORDER BY id ASC
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    dungeon_id: row[0],
    dungeon_key: row[1],
    dungeon_name: row[2],
    min_level: row[3],
    recommended_power: row[4],
    energy_cost: row[5],
    base_gold: row[6],
    boss_name: row[7]
  }));
}

async function enterDungeon({ playerId, dungeonId }) {
  const db = await initDB();

  const playerResult = db.exec(
    `SELECT id, nickname, level FROM players WHERE id = ?`,
    [Number(playerId)]
  );

  if (!playerResult.length || !playerResult[0].values.length) {
    throw new Error("player not found");
  }

  const player = playerResult[0].values[0];

  const dungeonResult = db.exec(
    `SELECT id, dungeon_name, min_level FROM dungeons WHERE id = ?`,
    [Number(dungeonId)]
  );

  if (!dungeonResult.length || !dungeonResult[0].values.length) {
    throw new Error("dungeon not found");
  }

  const dungeon = dungeonResult[0].values[0];

  if (Number(player[2]) < Number(dungeon[2])) {
    throw new Error("player level too low for dungeon");
  }

  const active = db.exec(
    `SELECT id FROM dungeon_instances
     WHERE player_id = ?
       AND status = 'active'`,
    [Number(playerId)]
  );

  if (active.length && active[0].values.length) {
    throw new Error("player already has an active dungeon instance");
  }

  db.run(
    `INSERT INTO dungeon_instances (
      player_id,
      dungeon_id,
      status,
      progress_stage,
      mobs_remaining,
      boss_spawned,
      completed,
      total_gold_earned,
      created_at,
      updated_at
    ) VALUES (?, ?, 'active', 1, 5, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [Number(playerId), Number(dungeonId)]
  );

  saveDB();

  const created = db.exec(`
    SELECT id, player_id, dungeon_id, status, progress_stage, mobs_remaining, boss_spawned, completed, total_gold_earned, created_at
    FROM dungeon_instances
    ORDER BY id DESC
    LIMIT 1
  `);

  const row = created[0].values[0];

  await createEvent({
    eventType: "dungeon_enter",
    title: "Dungeon Entered",
    message: `⚔️ ${player[1]} entered ${dungeon[1]}`,
    metadata: {
      instance_id: row[0],
      player_id: row[1],
      dungeon_id: row[2]
    }
  });

  return {
    instance_id: row[0],
    player_id: row[1],
    dungeon_id: row[2],
    status: row[3],
    progress_stage: row[4],
    mobs_remaining: row[5],
    boss_spawned: Boolean(row[6]),
    completed: Boolean(row[7]),
    total_gold_earned: row[8],
    created_at: row[9]
  };
}

async function getDungeonStatus(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT di.id, di.player_id, di.dungeon_id, d.dungeon_name, di.status, di.progress_stage,
            di.mobs_remaining, di.boss_spawned, di.completed, di.total_gold_earned, di.created_at, di.updated_at
     FROM dungeon_instances di
     INNER JOIN dungeons d ON d.id = di.dungeon_id
     WHERE di.player_id = ?
       AND di.status = 'active'
     ORDER BY di.id DESC
     LIMIT 1`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    throw new Error("active dungeon instance not found");
  }

  const row = result[0].values[0];

  return {
    instance_id: row[0],
    player_id: row[1],
    dungeon_id: row[2],
    dungeon_name: row[3],
    status: row[4],
    progress_stage: row[5],
    mobs_remaining: row[6],
    boss_spawned: Boolean(row[7]),
    completed: Boolean(row[8]),
    total_gold_earned: row[9],
    created_at: row[10],
    updated_at: row[11]
  };
}

function randomLoot() {
  const roll = Math.random() * 100;

  if (roll <= 10) {
    return { loot_type: "crystal", loot_name: "Rare Mana Crystal", amount: 1, gold_bonus: 300 };
  }

  if (roll <= 35) {
    return { loot_type: "crystal", loot_name: "Common Mana Crystal", amount: 2, gold_bonus: 120 };
  }

  if (roll <= 60) {
    return { loot_type: "gold", loot_name: "Dungeon Gold", amount: 250, gold_bonus: 250 };
  }

  if (roll <= 80) {
    return { loot_type: "material", loot_name: "Forge Fragment", amount: 1, gold_bonus: 150 };
  }

  return { loot_type: "gold", loot_name: "Dungeon Gold", amount: 120, gold_bonus: 120 };
}

async function progressDungeon({ playerId }) {
  const db = await initDB();

  const status = await getDungeonStatus(playerId);

  if (status.completed) {
    throw new Error("dungeon already completed");
  }

  let mobsRemaining = Number(status.mobs_remaining);
  let bossSpawned = Boolean(status.boss_spawned);
  let progressStage = Number(status.progress_stage);
  let totalGold = Number(status.total_gold_earned);

  const loot = randomLoot();
  totalGold += Number(loot.gold_bonus || 0);

  db.run(
    `INSERT INTO dungeon_loot (
      instance_id,
      player_id,
      loot_type,
      loot_name,
      amount,
      created_at
    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      Number(status.instance_id),
      Number(playerId),
      String(loot.loot_type),
      String(loot.loot_name),
      Number(loot.amount)
    ]
  );

  db.run(
    `UPDATE currencies
     SET gold = gold + ?
     WHERE player_id = ?`,
    [Number(loot.gold_bonus || 0), Number(playerId)]
  );

  if (!bossSpawned) {
    mobsRemaining -= 1;

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

  db.run(
    `UPDATE dungeon_instances
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
      progressStage,
      mobsRemaining,
      bossSpawned ? 1 : 0,
      completed,
      totalGold,
      newStatus,
      completed,
      Number(status.instance_id)
    ]
  );

  saveDB();

  if (completed) {
    const playerResult = db.exec(
      `SELECT nickname FROM players WHERE id = ?`,
      [Number(playerId)]
    );
    const nickname = playerResult[0]?.values?.[0]?.[0] || `Player ${playerId}`;

    await createEvent({
      eventType: "dungeon_completed",
      title: "Dungeon Completed",
      message: `🏆 ${nickname} completed ${status.dungeon_name}`,
      metadata: {
        instance_id: Number(status.instance_id),
        player_id: Number(playerId),
        dungeon_id: Number(status.dungeon_id),
        total_gold_earned: totalGold
      }
    });
  }

  return {
    instance_id: Number(status.instance_id),
    dungeon_name: status.dungeon_name,
    loot,
    progress_stage: progressStage,
    mobs_remaining: mobsRemaining,
    boss_spawned: bossSpawned,
    completed: Boolean(completed),
    total_gold_earned: totalGold
  };
}

async function getDungeonLoot(playerId) {
  const db = await initDB();

  const latest = db.exec(
    `SELECT id
     FROM dungeon_instances
     WHERE player_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [Number(playerId)]
  );

  if (!latest.length || !latest[0].values.length) {
    return [];
  }

  const instanceId = latest[0].values[0][0];

  const result = db.exec(
    `SELECT id, instance_id, player_id, loot_type, loot_name, amount, created_at
     FROM dungeon_loot
     WHERE instance_id = ?
     ORDER BY id DESC`,
    [Number(instanceId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    instance_id: row[1],
    player_id: row[2],
    loot_type: row[3],
    loot_name: row[4],
    amount: row[5],
    created_at: row[6]
  }));
}

async function exitDungeon({ playerId }) {
  const db = await initDB();

  const active = db.exec(
    `SELECT id, status
     FROM dungeon_instances
     WHERE player_id = ?
       AND status = 'active'
     ORDER BY id DESC
     LIMIT 1`,
    [Number(playerId)]
  );

  if (!active.length || !active[0].values.length) {
    throw new Error("active dungeon instance not found");
  }

  const instanceId = active[0].values[0][0];

  db.run(
    `UPDATE dungeon_instances
     SET status = 'exited',
         updated_at = CURRENT_TIMESTAMP,
         finished_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [Number(instanceId)]
  );

  saveDB();

  return {
    instance_id: Number(instanceId),
    status: "exited"
  };
}

module.exports = {
  ensureDungeonTables,
  seedDungeons,
  listDungeons,
  enterDungeon,
  getDungeonStatus,
  progressDungeon,
  getDungeonLoot,
  exitDungeon
};
