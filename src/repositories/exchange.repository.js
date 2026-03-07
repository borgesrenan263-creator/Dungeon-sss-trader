const { initDB, saveDB } = require("../config/database");
const { buyObsidian } = require("./obsidian.repository");

const OBSIDIAN_TO_GOLD_RATE = 100000;

async function ensureExchangeTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS exchange_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      exchange_type TEXT NOT NULL,
      obsidian_amount REAL DEFAULT 0,
      gold_amount INTEGER DEFAULT 0,
      usdt_amount REAL DEFAULT 0,
      rate_label TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function getExchangeRates() {
  return {
    buy_obsidian_with_usdt: {
      obsidian_unit_price_usdt: 100
    },
    sell_obsidian_for_gold: {
      obsidian_unit_value_gold: OBSIDIAN_TO_GOLD_RATE
    }
  };
}

async function buyObsidianAtExchange({ playerId, amount }) {
  const result = await buyObsidian({ playerId, amount });
  const db = await initDB();

  db.run(
    `INSERT INTO exchange_logs (
      player_id,
      exchange_type,
      obsidian_amount,
      usdt_amount,
      rate_label
    ) VALUES (?, 'buy_obsidian_usdt', ?, ?, ?);`,
    [
      Number(playerId),
      Number(amount),
      Number(result.total_price_usdt),
      '1 Obsidiana = 100 USDT'
    ]
  );

  saveDB();

  return result;
}

async function sellObsidianForGold({ playerId, amount }) {
  const db = await initDB();

  const safeAmount = Number(amount);

  if (!safeAmount || safeAmount <= 0) {
    throw new Error("invalid obsidian amount");
  }

  const walletResult = db.exec(
    `SELECT obsidian
     FROM currencies
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  if (!walletResult.length || !walletResult[0].values.length) {
    throw new Error("player wallet not found");
  }

  const currentObsidian = Number(walletResult[0].values[0][0] || 0);

  if (currentObsidian < safeAmount) {
    throw new Error("insufficient obsidian");
  }

  const goldValue = Math.floor(safeAmount * OBSIDIAN_TO_GOLD_RATE);

  db.run(
    `UPDATE currencies
     SET obsidian = obsidian - ?,
         gold = gold + ?
     WHERE player_id = ?;`,
    [safeAmount, goldValue, Number(playerId)]
  );

  db.run(
    `INSERT INTO exchange_logs (
      player_id,
      exchange_type,
      obsidian_amount,
      gold_amount,
      rate_label
    ) VALUES (?, 'sell_obsidian_gold', ?, ?, ?);`,
    [
      Number(playerId),
      safeAmount,
      goldValue,
      '1 Obsidiana = 100000 Ouro'
    ]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    obsidian_sold: safeAmount,
    gold_received: goldValue,
    rate_used: OBSIDIAN_TO_GOLD_RATE
  };
}

async function getExchangeHistory(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id,
            player_id,
            exchange_type,
            obsidian_amount,
            gold_amount,
            usdt_amount,
            rate_label,
            created_at
     FROM exchange_logs
     WHERE player_id = ?
     ORDER BY id DESC;`,
    [Number(playerId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    player_id: row[1],
    exchange_type: row[2],
    obsidian_amount: row[3],
    gold_amount: row[4],
    usdt_amount: row[5],
    rate_label: row[6],
    created_at: row[7]
  }));
}

module.exports = {
  OBSIDIAN_TO_GOLD_RATE,
  ensureExchangeTables,
  getExchangeRates,
  buyObsidianAtExchange,
  sellObsidianForGold,
  getExchangeHistory
};
