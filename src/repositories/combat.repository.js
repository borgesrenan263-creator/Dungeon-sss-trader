const { initDB, saveDB } = require("../config/database");
const { hasActiveCollectorPet } = require("./pets.repository");

const CRYSTAL_TABLE = [
  { rank: "F", gold: 50, chance: 90 },
  { rank: "E", gold: 200, chance: 70 },
  { rank: "D", gold: 600, chance: 50 },
  { rank: "C", gold: 1500, chance: 35 },
  { rank: "B", gold: 4000, chance: 20 },
  { rank: "A", gold: 8000, chance: 20 },
  { rank: "SS", gold: 15000, chance: 5 }
];

async function ensureCombatTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS monsters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sector INTEGER DEFAULT 1,
      hp INTEGER DEFAULT 100,
      attack INTEGER DEFAULT 10,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS combat_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      monster_id INTEGER NOT NULL,
      crystal_rank TEXT NOT NULL,
      gold_earned INTEGER NOT NULL,
      collected_by_pet INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS mana_crystal_drops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      monster_id INTEGER NOT NULL,
      crystal_rank TEXT NOT NULL,
      gold_value INTEGER NOT NULL,
      collected_by_pet INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveDB();
}

function rollCrystal() {
  const roll = Math.random() * 100;

  if (roll <= 5) return { rank: "SS", gold: 15000 };
  if (roll <= 20) return { rank: "A", gold: 8000 };
  if (roll <= 40) return { rank: "B", gold: 4000 };
  if (roll <= 75) return { rank: "C", gold: 1500 };
  if (roll <= 90) return { rank: "D", gold: 600 };
  if (roll <= 97) return { rank: "E", gold: 200 };
  return { rank: "F", gold: 50 };
}

async function seedMonsters() {
  const db = await initDB();

  const existing = db.exec(`SELECT COUNT(*) FROM monsters;`);
  const total = existing[0]?.values?.[0]?.[0] || 0;

  if (total > 0) return;

  db.run(`
    INSERT INTO monsters (name, sector, hp, attack) VALUES
    ('Slime Sombrio', 1, 50, 5),
    ('Lobo Corrompido', 1, 80, 8),
    ('Goblin de Mana', 2, 120, 12),
    ('Aranha Abissal', 2, 150, 15),
    ('Cavaleiro Caído', 3, 220, 25);
  `);

  saveDB();
}

async function killMonster({ playerId, monsterId }) {
  const db = await initDB();

  const playerResult = db.exec(
    `SELECT id, nickname, class, level, xp
     FROM players
     WHERE id = ?;`,
    [Number(playerId)]
  );

  if (!playerResult.length || !playerResult[0].values.length) {
    throw new Error("player not found");
  }

  const monsterResult = db.exec(
    `SELECT id, name, sector, hp, attack
     FROM monsters
     WHERE id = ?;`,
    [Number(monsterId)]
  );

  if (!monsterResult.length || !monsterResult[0].values.length) {
    throw new Error("monster not found");
  }

  const playerRow = playerResult[0].values[0];
  const monsterRow = monsterResult[0].values[0];
  const drop = rollCrystal();
  const collectedByPet = await hasActiveCollectorPet(playerId);

  db.run(
    `UPDATE currencies
     SET gold = gold + ?
     WHERE player_id = ?;`,
    [drop.gold, Number(playerId)]
  );

  db.run(
    `UPDATE players
     SET xp = xp + 10
     WHERE id = ?;`,
    [Number(playerId)]
  );

  db.run(
    `INSERT INTO combat_logs (
      player_id,
      monster_id,
      crystal_rank,
      gold_earned,
      collected_by_pet
    ) VALUES (?, ?, ?, ?, ?);`,
    [
      Number(playerId),
      Number(monsterId),
      drop.rank,
      drop.gold,
      collectedByPet ? 1 : 0
    ]
  );

  db.run(
    `INSERT INTO mana_crystal_drops (
      player_id,
      monster_id,
      crystal_rank,
      gold_value,
      collected_by_pet
    ) VALUES (?, ?, ?, ?, ?);`,
    [
      Number(playerId),
      Number(monsterId),
      drop.rank,
      drop.gold,
      collectedByPet ? 1 : 0
    ]
  );

  saveDB();

  return {
    player: {
      id: playerRow[0],
      nickname: playerRow[1],
      class: playerRow[2],
      level: playerRow[3],
      xp_gained: 10
    },
    monster: {
      id: monsterRow[0],
      name: monsterRow[1],
      sector: monsterRow[2]
    },
    drop,
    collected_by_pet: collectedByPet
  };
}

async function getMonsters() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id, name, sector, hp, attack
    FROM monsters
    ORDER BY id ASC;
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    name: row[1],
    sector: row[2],
    hp: row[3],
    attack: row[4]
  }));
}

async function getCombatLogs(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, player_id, monster_id, crystal_rank, gold_earned, collected_by_pet, created_at
     FROM combat_logs
     WHERE player_id = ?
     ORDER BY id DESC;`,
    [Number(playerId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    player_id: row[1],
    monster_id: row[2],
    crystal_rank: row[3],
    gold_earned: row[4],
    collected_by_pet: Boolean(row[5]),
    created_at: row[6]
  }));
}

async function getCrystalDrops(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, player_id, monster_id, crystal_rank, gold_value, collected_by_pet, created_at
     FROM mana_crystal_drops
     WHERE player_id = ?
     ORDER BY id DESC;`,
    [Number(playerId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    player_id: row[1],
    monster_id: row[2],
    crystal_rank: row[3],
    gold_value: row[4],
    collected_by_pet: Boolean(row[5]),
    created_at: row[6]
  }));
}

module.exports = {
  CRYSTAL_TABLE,
  ensureCombatTables,
  seedMonsters,
  killMonster,
  getMonsters,
  getCombatLogs,
  getCrystalDrops
};
