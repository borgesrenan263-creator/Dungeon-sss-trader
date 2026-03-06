const { initDB, saveDB } = require("../config/database");

const OBSIDIAN_MAX_SUPPLY = 5000000;
const OBSIDIAN_PRICE_USDT = 100;

async function ensureObsidianTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS obsidian_system (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      max_supply REAL NOT NULL,
      current_supply REAL NOT NULL,
      price_usdt REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS merchant_titles (
      player_id INTEGER PRIMARY KEY,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveDB();
}

async function seedObsidianSystem() {
  const db = await initDB();

  const existing = db.exec(`SELECT COUNT(*) FROM obsidian_system;`);
  const total = existing[0]?.values?.[0]?.[0] || 0;

  if (total > 0) return;

  db.run(
    `INSERT INTO obsidian_system (max_supply, current_supply, price_usdt)
     VALUES (?, 0, ?);`,
    [OBSIDIAN_MAX_SUPPLY, OBSIDIAN_PRICE_USDT]
  );

  saveDB();
}

async function getObsidianStatus() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id, max_supply, current_supply, price_usdt
    FROM obsidian_system
    ORDER BY id DESC
    LIMIT 1;
  `);

  if (!result.length || !result[0].values.length) {
    throw new Error("obsidian system not initialized");
  }

  const row = result[0].values[0];

  return {
    id: row[0],
    max_supply: Number(row[1]),
    current_supply: Number(row[2]),
    remaining_supply: Number(row[1]) - Number(row[2]),
    price_usdt: Number(row[3])
  };
}

async function buyObsidian({ playerId, amount }) {
  const db = await initDB();

  const safeAmount = Number(amount);

  if (!safeAmount || safeAmount <= 0) {
    throw new Error("invalid obsidian amount");
  }

  const systemResult = db.exec(`
    SELECT id, max_supply, current_supply, price_usdt
    FROM obsidian_system
    ORDER BY id DESC
    LIMIT 1;
  `);

  if (!systemResult.length || !systemResult[0].values.length) {
    throw new Error("obsidian system not initialized");
  }

  const systemRow = systemResult[0].values[0];
  const maxSupply = Number(systemRow[1]);
  const currentSupply = Number(systemRow[2]);
  const priceUsdt = Number(systemRow[3]);

  if (currentSupply + safeAmount > maxSupply) {
    throw new Error("obsidian supply exceeded");
  }

  const walletResult = db.exec(
    `SELECT usdt, obsidian
     FROM currencies
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  if (!walletResult.length || !walletResult[0].values.length) {
    throw new Error("player wallet not found");
  }

  const currentUsdt = Number(walletResult[0].values[0][0] || 0);
  const totalPrice = Number((safeAmount * priceUsdt).toFixed(2));

  if (currentUsdt < totalPrice) {
    throw new Error("insufficient usdt");
  }

  db.run(
    `UPDATE currencies
     SET usdt = usdt - ?,
         obsidian = obsidian + ?
     WHERE player_id = ?;`,
    [totalPrice, safeAmount, Number(playerId)]
  );

  db.run(
    `UPDATE obsidian_system
     SET current_supply = current_supply + ?
     WHERE id = ?;`,
    [safeAmount, Number(systemRow[0])]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    obsidian_bought: safeAmount,
    total_price_usdt: totalPrice,
    new_supply: currentSupply + safeAmount,
    remaining_supply: maxSupply - (currentSupply + safeAmount)
  };
}

async function buyMerchantTitle(playerId) {
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

  if (obsidian < 1) {
    throw new Error("not enough obsidian");
  }

  const existing = db.exec(
    `SELECT player_id
     FROM merchant_titles
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  if (existing.length && existing[0].values.length) {
    throw new Error("merchant title already owned");
  }

  db.run(
    `UPDATE currencies
     SET obsidian = obsidian - 1
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  db.run(
    `INSERT INTO merchant_titles (player_id, active)
     VALUES (?, 1);`,
    [Number(playerId)]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    title: "Comerciante",
    obsidian_spent: 1
  };
}

async function hasMerchantTitle(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT player_id, active
     FROM merchant_titles
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    return false;
  }

  return Number(result[0].values[0][1]) === 1;
}

module.exports = {
  OBSIDIAN_MAX_SUPPLY,
  OBSIDIAN_PRICE_USDT,
  ensureObsidianTables,
  seedObsidianSystem,
  getObsidianStatus,
  buyObsidian,
  buyMerchantTitle,
  hasMerchantTitle
};
