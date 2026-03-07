const { initDB, saveDB } = require("../config/database");

const CRYSTAL_TYPES = [
  {
    crystal_key: "common_mana_crystal",
    crystal_name: "Common Mana Crystal",
    rank: "C",
    base_value: 100,
    forge_power: 1
  },
  {
    crystal_key: "rare_mana_crystal",
    crystal_name: "Rare Mana Crystal",
    rank: "R",
    base_value: 300,
    forge_power: 2
  },
  {
    crystal_key: "epic_mana_crystal",
    crystal_name: "Epic Mana Crystal",
    rank: "E",
    base_value: 800,
    forge_power: 4
  },
  {
    crystal_key: "legend_mana_crystal",
    crystal_name: "Legend Mana Crystal",
    rank: "L",
    base_value: 2000,
    forge_power: 8
  }
];

async function ensureCrystalTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS crystals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crystal_key TEXT UNIQUE NOT NULL,
      crystal_name TEXT NOT NULL,
      rank TEXT NOT NULL,
      base_value INTEGER NOT NULL,
      forge_power INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS player_crystals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      crystal_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, crystal_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS crystal_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      crystal_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      source_type TEXT NOT NULL,
      source_ref_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function seedCrystals() {
  const db = await initDB();

  for (const crystal of CRYSTAL_TYPES) {
    const existing = db.exec(
      `SELECT id FROM crystals WHERE crystal_key = ?;`,
      [crystal.crystal_key]
    );

    if (existing.length && existing[0].values.length) continue;

    db.run(
      `INSERT INTO crystals (
        crystal_key,
        crystal_name,
        rank,
        base_value,
        forge_power
      ) VALUES (?, ?, ?, ?, ?);`,
      [
        crystal.crystal_key,
        crystal.crystal_name,
        crystal.rank,
        crystal.base_value,
        crystal.forge_power
      ]
    );
  }

  saveDB();
}

function rollCrystalRewardBySector(sectorId = 1) {
  const safeSector = Number(sectorId) || 1;
  const roll = Math.random() * 100;

  if (safeSector >= 8) {
    if (roll <= 10) return { rank: "L", quantity: 1 };
    if (roll <= 35) return { rank: "E", quantity: 1 };
    if (roll <= 70) return { rank: "R", quantity: 2 };
    return { rank: "C", quantity: 3 };
  }

  if (safeSector >= 5) {
    if (roll <= 5) return { rank: "L", quantity: 1 };
    if (roll <= 20) return { rank: "E", quantity: 1 };
    if (roll <= 55) return { rank: "R", quantity: 2 };
    return { rank: "C", quantity: 3 };
  }

  if (safeSector >= 3) {
    if (roll <= 2) return { rank: "L", quantity: 1 };
    if (roll <= 10) return { rank: "E", quantity: 1 };
    if (roll <= 40) return { rank: "R", quantity: 2 };
    return { rank: "C", quantity: 2 };
  }

  if (roll <= 1) return { rank: "L", quantity: 1 };
  if (roll <= 5) return { rank: "E", quantity: 1 };
  if (roll <= 25) return { rank: "R", quantity: 1 };
  return { rank: "C", quantity: 1 };
}

async function getCrystalByRank(rank) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, crystal_key, crystal_name, rank, base_value, forge_power
     FROM crystals
     WHERE rank = ?;`,
    [String(rank)]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];

  return {
    id: row[0],
    crystal_key: row[1],
    crystal_name: row[2],
    rank: row[3],
    base_value: row[4],
    forge_power: row[5]
  };
}

async function addCrystalToPlayer({
  playerId,
  crystalId,
  quantity,
  sourceType,
  sourceRefId = null
}) {
  const db = await initDB();

  const safeQty = Number(quantity) || 0;
  if (safeQty <= 0) throw new Error("invalid crystal quantity");

  const existing = db.exec(
    `SELECT id, quantity
     FROM player_crystals
     WHERE player_id = ?
       AND crystal_id = ?;`,
    [Number(playerId), Number(crystalId)]
  );

  if (existing.length && existing[0].values.length) {
    db.run(
      `UPDATE player_crystals
       SET quantity = quantity + ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE player_id = ?
         AND crystal_id = ?;`,
      [safeQty, Number(playerId), Number(crystalId)]
    );
  } else {
    db.run(
      `INSERT INTO player_crystals (
        player_id,
        crystal_id,
        quantity
      ) VALUES (?, ?, ?);`,
      [Number(playerId), Number(crystalId), safeQty]
    );
  }

  db.run(
    `INSERT INTO crystal_logs (
      player_id,
      crystal_id,
      quantity,
      source_type,
      source_ref_id
    ) VALUES (?, ?, ?, ?, ?);`,
    [
      Number(playerId),
      Number(crystalId),
      safeQty,
      String(sourceType),
      sourceRefId ? Number(sourceRefId) : null
    ]
  );

  saveDB();
}

async function rewardCombatCrystal({ playerId, monsterId, sectorId }) {
  const reward = rollCrystalRewardBySector(sectorId);
  const crystal = await getCrystalByRank(reward.rank);

  if (!crystal) {
    throw new Error("crystal config not found");
  }

  await addCrystalToPlayer({
    playerId,
    crystalId: crystal.id,
    quantity: reward.quantity,
    sourceType: "combat_kill",
    sourceRefId: monsterId
  });

  return {
    crystal_id: crystal.id,
    crystal_key: crystal.crystal_key,
    crystal_name: crystal.crystal_name,
    rank: crystal.rank,
    quantity: reward.quantity,
    base_value: crystal.base_value,
    forge_power: crystal.forge_power
  };
}

async function getPlayerCrystals(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT pc.id,
            pc.player_id,
            pc.crystal_id,
            c.crystal_key,
            c.crystal_name,
            c.rank,
            c.base_value,
            c.forge_power,
            pc.quantity,
            pc.updated_at
     FROM player_crystals pc
     INNER JOIN crystals c ON c.id = pc.crystal_id
     WHERE pc.player_id = ?
     ORDER BY c.base_value ASC;`,
    [Number(playerId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    player_crystal_id: row[0],
    player_id: row[1],
    crystal_id: row[2],
    crystal_key: row[3],
    crystal_name: row[4],
    rank: row[5],
    base_value: row[6],
    forge_power: row[7],
    quantity: row[8],
    updated_at: row[9]
  }));
}

async function getCrystalLogs(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT cl.id,
            cl.player_id,
            cl.crystal_id,
            c.crystal_name,
            c.rank,
            cl.quantity,
            cl.source_type,
            cl.source_ref_id,
            cl.created_at
     FROM crystal_logs cl
     INNER JOIN crystals c ON c.id = cl.crystal_id
     WHERE cl.player_id = ?
     ORDER BY cl.id DESC
     LIMIT 30;`,
    [Number(playerId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    player_id: row[1],
    crystal_id: row[2],
    crystal_name: row[3],
    rank: row[4],
    quantity: row[5],
    source_type: row[6],
    source_ref_id: row[7],
    created_at: row[8]
  }));
}

module.exports = {
  ensureCrystalTables,
  seedCrystals,
  rewardCombatCrystal,
  getPlayerCrystals,
  getCrystalLogs
};
