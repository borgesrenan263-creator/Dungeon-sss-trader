const { initDB, saveDB } = require("../config/database");

const COLLECTOR_PET_PRICE_OBSIDIAN = 1.5;

async function ensurePetsTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS player_pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      pet_type TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveDB();
}

async function buyCollectorPet(playerId) {
  const db = await initDB();

  const walletResult = db.exec(
    `SELECT obsidian
     FROM currencies
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  if (!walletResult.length || !walletResult[0].values.length) {
    throw new Error("player wallet not found");
  }

  const obsidian = Number(walletResult[0].values[0][0] || 0);

  if (obsidian < COLLECTOR_PET_PRICE_OBSIDIAN) {
    throw new Error("not enough obsidian");
  }

  db.run(
    `UPDATE currencies
     SET obsidian = obsidian - ?
     WHERE player_id = ?;`,
    [COLLECTOR_PET_PRICE_OBSIDIAN, Number(playerId)]
  );

  db.run(
    `INSERT INTO player_pets (player_id, pet_type, active)
     VALUES (?, 'collector', 1);`,
    [Number(playerId)]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    pet_type: "collector",
    cost_obsidian: COLLECTOR_PET_PRICE_OBSIDIAN
  };
}

async function getPlayerPets(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, player_id, pet_type, active, created_at
     FROM player_pets
     WHERE player_id = ?
     ORDER BY id DESC;`,
    [Number(playerId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    player_id: row[1],
    pet_type: row[2],
    active: Boolean(row[3]),
    created_at: row[4]
  }));
}

async function hasActiveCollectorPet(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id
     FROM player_pets
     WHERE player_id = ?
       AND pet_type = 'collector'
       AND active = 1
     ORDER BY id DESC
     LIMIT 1;`,
    [Number(playerId)]
  );

  return !!(result.length && result[0].values.length);
}

module.exports = {
  COLLECTOR_PET_PRICE_OBSIDIAN,
  ensurePetsTables,
  buyCollectorPet,
  getPlayerPets,
  hasActiveCollectorPet
};
