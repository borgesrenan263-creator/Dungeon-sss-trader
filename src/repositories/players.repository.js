const { initDB, saveDB } = require("../config/database");

async function ensurePlayersTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT UNIQUE,
      class TEXT,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS currencies (
      player_id INTEGER PRIMARY KEY,
      gold INTEGER DEFAULT 0,
      obsidian REAL DEFAULT 0,
      usdt REAL DEFAULT 0
    );
  `);

  saveDB();
}

async function createPlayer({ nickname, className }) {
  const db = await initDB();

  db.run(
    `INSERT INTO players (nickname, class) VALUES (?, ?)`,
    [nickname, className]
  );

  const result = db.exec(
    `SELECT id, nickname, class, level, xp FROM players WHERE nickname=?`,
    [nickname]
  );

  const row = result[0].values[0];

  db.run(
    `INSERT INTO currencies (player_id, gold, obsidian, usdt)
     VALUES (?,0,0,0)`,
    [row[0]]
  );

  saveDB();

  return {
    id: row[0],
    nickname: row[1],
    class: row[2],
    level: row[3],
    xp: row[4]
  };
}

async function getAllPlayers() {
  const db = await initDB();

  const result = db.exec(`SELECT * FROM players`);

  if (!result.length) return [];

  return result[0].values.map(row => ({
    id: row[0],
    nickname: row[1],
    class: row[2],
    level: row[3],
    xp: row[4]
  }));
}

async function getPlayerById(id) {
  const db = await initDB();

  const result = db.exec(
    `SELECT * FROM players WHERE id=?`,
    [Number(id)]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];

  return {
    id: row[0],
    nickname: row[1],
    class: row[2],
    level: row[3],
    xp: row[4]
  };
}

module.exports = {
  ensurePlayersTables,
  createPlayer,
  getAllPlayers,
  getPlayerById
};
