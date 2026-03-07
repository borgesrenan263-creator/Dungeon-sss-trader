const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

async function ensureTradeTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS trade_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1_id INTEGER NOT NULL,
      player2_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      player1_accepted INTEGER DEFAULT 0,
      player2_accepted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS trade_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trade_id INTEGER NOT NULL,
      owner_player_id INTEGER NOT NULL,
      inventory_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS trade_gold_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trade_id INTEGER NOT NULL,
      owner_player_id INTEGER NOT NULL,
      gold_amount INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(trade_id, owner_player_id)
    )
  `);

  saveDB();
}

async function getPlayerBasic(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, nickname
     FROM players
     WHERE id = ?`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  return {
    player_id: result[0].values[0][0],
    nickname: result[0].values[0][1]
  };
}

async function getTradeById(tradeId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, player1_id, player2_id, status, player1_accepted, player2_accepted, created_at, completed_at
     FROM trade_sessions
     WHERE id = ?`,
    [Number(tradeId)]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const row = result[0].values[0];

  return {
    trade_id: row[0],
    player1_id: row[1],
    player2_id: row[2],
    status: row[3],
    player1_accepted: Boolean(row[4]),
    player2_accepted: Boolean(row[5]),
    created_at: row[6],
    completed_at: row[7]
  };
}

async function resetTradeAcceptances(tradeId) {
  const db = await initDB();

  db.run(
    `UPDATE trade_sessions
     SET player1_accepted = 0,
         player2_accepted = 0
     WHERE id = ?`,
    [Number(tradeId)]
  );

  saveDB();
}

async function createTrade({ player1Id, player2Id }) {
  const db = await initDB();

  if (Number(player1Id) === Number(player2Id)) {
    throw new Error("players must be different");
  }

  const p1 = await getPlayerBasic(player1Id);
  const p2 = await getPlayerBasic(player2Id);

  if (!p1) throw new Error("player1 not found");
  if (!p2) throw new Error("player2 not found");

  db.run(
    `INSERT INTO trade_sessions (
      player1_id,
      player2_id,
      status,
      player1_accepted,
      player2_accepted,
      created_at
    ) VALUES (?, ?, 'pending', 0, 0, CURRENT_TIMESTAMP)`,
    [Number(player1Id), Number(player2Id)]
  );

  saveDB();

  const created = db.exec(`
    SELECT id, player1_id, player2_id, status, player1_accepted, player2_accepted, created_at
    FROM trade_sessions
    ORDER BY id DESC
    LIMIT 1
  `);

  const row = created[0].values[0];

  await createEvent({
    eventType: "trade_created",
    title: "Trade Started",
    message: `🤝 ${p1.nickname} started a trade with ${p2.nickname}`,
    metadata: {
      trade_id: row[0],
      player1_id: row[1],
      player2_id: row[2]
    }
  });

  return {
    trade_id: row[0],
    player1_id: row[1],
    player2_id: row[2],
    status: row[3],
    player1_accepted: Boolean(row[4]),
    player2_accepted: Boolean(row[5]),
    created_at: row[6]
  };
}

async function addTradeItem({ tradeId, ownerPlayerId, inventoryId }) {
  const db = await initDB();

  const trade = await getTradeById(tradeId);
  if (!trade) throw new Error("trade not found");
  if (trade.status !== "pending") throw new Error("trade is not pending");

  if (
    Number(ownerPlayerId) !== Number(trade.player1_id) &&
    Number(ownerPlayerId) !== Number(trade.player2_id)
  ) {
    throw new Error("player does not belong to this trade");
  }

  const inv = db.exec(
    `SELECT id, player_id, item_id
     FROM inventory
     WHERE id = ?`,
    [Number(inventoryId)]
  );

  if (!inv.length || !inv[0].values.length) {
    throw new Error("inventory item not found");
  }

  const row = inv[0].values[0];

  if (Number(row[1]) !== Number(ownerPlayerId)) {
    throw new Error("item does not belong to player");
  }

  const already = db.exec(
    `SELECT id
     FROM trade_items
     WHERE trade_id = ?
       AND inventory_id = ?`,
    [Number(tradeId), Number(inventoryId)]
  );

  if (already.length && already[0].values.length) {
    throw new Error("item already added to trade");
  }

  db.run(
    `INSERT INTO trade_items (
      trade_id,
      owner_player_id,
      inventory_id,
      item_id,
      created_at
    ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      Number(tradeId),
      Number(ownerPlayerId),
      Number(inventoryId),
      Number(row[2])
    ]
  );

  saveDB();
  await resetTradeAcceptances(tradeId);

  return {
    trade_id: Number(tradeId),
    owner_player_id: Number(ownerPlayerId),
    inventory_id: Number(inventoryId),
    item_id: Number(row[2])
  };
}

async function addTradeGold({ tradeId, ownerPlayerId, goldAmount }) {
  const db = await initDB();

  const trade = await getTradeById(tradeId);
  if (!trade) throw new Error("trade not found");
  if (trade.status !== "pending") throw new Error("trade is not pending");

  if (
    Number(ownerPlayerId) !== Number(trade.player1_id) &&
    Number(ownerPlayerId) !== Number(trade.player2_id)
  ) {
    throw new Error("player does not belong to this trade");
  }

  const safeGold = Number(goldAmount) || 0;
  if (safeGold < 0) {
    throw new Error("invalid gold amount");
  }

  const wallet = db.exec(
    `SELECT gold
     FROM currencies
     WHERE player_id = ?`,
    [Number(ownerPlayerId)]
  );

  if (!wallet.length || !wallet[0].values.length) {
    throw new Error("player wallet not found");
  }

  const playerGold = Number(wallet[0].values[0][0] || 0);
  if (playerGold < safeGold) {
    throw new Error("insufficient gold");
  }

  const existing = db.exec(
    `SELECT id
     FROM trade_gold_offers
     WHERE trade_id = ?
       AND owner_player_id = ?`,
    [Number(tradeId), Number(ownerPlayerId)]
  );

  if (existing.length && existing[0].values.length) {
    db.run(
      `UPDATE trade_gold_offers
       SET gold_amount = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE trade_id = ?
         AND owner_player_id = ?`,
      [safeGold, Number(tradeId), Number(ownerPlayerId)]
    );
  } else {
    db.run(
      `INSERT INTO trade_gold_offers (
        trade_id,
        owner_player_id,
        gold_amount,
        updated_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [Number(tradeId), Number(ownerPlayerId), safeGold]
    );
  }

  saveDB();
  await resetTradeAcceptances(tradeId);

  return {
    trade_id: Number(tradeId),
    owner_player_id: Number(ownerPlayerId),
    gold_amount: safeGold
  };
}

async function getTradeState(tradeId) {
  const db = await initDB();

  const trade = await getTradeById(tradeId);
  if (!trade) throw new Error("trade not found");

  const itemsResult = db.exec(
    `SELECT id, trade_id, owner_player_id, inventory_id, item_id, created_at
     FROM trade_items
     WHERE trade_id = ?
     ORDER BY id ASC`,
    [Number(tradeId)]
  );

  const goldResult = db.exec(
    `SELECT id, trade_id, owner_player_id, gold_amount, updated_at
     FROM trade_gold_offers
     WHERE trade_id = ?
     ORDER BY id ASC`,
    [Number(tradeId)]
  );

  const items = !itemsResult.length
    ? []
    : itemsResult[0].values.map((row) => ({
        id: row[0],
        trade_id: row[1],
        owner_player_id: row[2],
        inventory_id: row[3],
        item_id: row[4],
        created_at: row[5]
      }));

  const gold_offers = !goldResult.length
    ? []
    : goldResult[0].values.map((row) => ({
        id: row[0],
        trade_id: row[1],
        owner_player_id: row[2],
        gold_amount: row[3],
        updated_at: row[4]
      }));

  return {
    trade,
    items,
    gold_offers
  };
}

async function acceptTrade({ tradeId, playerId }) {
  const db = await initDB();

  const trade = await getTradeById(tradeId);
  if (!trade) throw new Error("trade not found");
  if (trade.status !== "pending") throw new Error("trade is not pending");

  if (Number(playerId) === Number(trade.player1_id)) {
    db.run(
      `UPDATE trade_sessions
       SET player1_accepted = 1
       WHERE id = ?`,
      [Number(tradeId)]
    );
  } else if (Number(playerId) === Number(trade.player2_id)) {
    db.run(
      `UPDATE trade_sessions
       SET player2_accepted = 1
       WHERE id = ?`,
      [Number(tradeId)]
    );
  } else {
    throw new Error("player does not belong to this trade");
  }

  saveDB();

  const updated = await getTradeById(tradeId);

  if (updated.player1_accepted && updated.player2_accepted) {
    return await completeTrade(tradeId);
  }

  return {
    trade_id: updated.trade_id,
    player1_accepted: updated.player1_accepted,
    player2_accepted: updated.player2_accepted,
    status: updated.status
  };
}

async function completeTrade(tradeId) {
  const db = await initDB();

  const trade = await getTradeById(tradeId);
  if (!trade) throw new Error("trade not found");
  if (trade.status !== "pending") throw new Error("trade is not pending");

  const state = await getTradeState(tradeId);

  const p1GoldOffer = state.gold_offers.find(
    (g) => Number(g.owner_player_id) === Number(trade.player1_id)
  );
  const p2GoldOffer = state.gold_offers.find(
    (g) => Number(g.owner_player_id) === Number(trade.player2_id)
  );

  const p1Gold = Number(p1GoldOffer?.gold_amount || 0);
  const p2Gold = Number(p2GoldOffer?.gold_amount || 0);

  const p1Wallet = db.exec(
    `SELECT gold FROM currencies WHERE player_id = ?`,
    [Number(trade.player1_id)]
  );
  const p2Wallet = db.exec(
    `SELECT gold FROM currencies WHERE player_id = ?`,
    [Number(trade.player2_id)]
  );

  const p1CurrentGold = Number(p1Wallet[0]?.values?.[0]?.[0] || 0);
  const p2CurrentGold = Number(p2Wallet[0]?.values?.[0]?.[0] || 0);

  if (p1CurrentGold < p1Gold) throw new Error("player1 insufficient gold");
  if (p2CurrentGold < p2Gold) throw new Error("player2 insufficient gold");

  for (const tradeItem of state.items) {
    const targetOwner =
      Number(tradeItem.owner_player_id) === Number(trade.player1_id)
        ? Number(trade.player2_id)
        : Number(trade.player1_id);

    db.run(
      `UPDATE inventory
       SET player_id = ?, equipped = 0
       WHERE id = ?`,
      [targetOwner, Number(tradeItem.inventory_id)]
    );
  }

  if (p1Gold > 0) {
    db.run(
      `UPDATE currencies
       SET gold = gold - ?
       WHERE player_id = ?`,
      [p1Gold, Number(trade.player1_id)]
    );

    db.run(
      `UPDATE currencies
       SET gold = gold + ?
       WHERE player_id = ?`,
      [p1Gold, Number(trade.player2_id)]
    );
  }

  if (p2Gold > 0) {
    db.run(
      `UPDATE currencies
       SET gold = gold - ?
       WHERE player_id = ?`,
      [p2Gold, Number(trade.player2_id)]
    );

    db.run(
      `UPDATE currencies
       SET gold = gold + ?
       WHERE player_id = ?`,
      [p2Gold, Number(trade.player1_id)]
    );
  }

  db.run(
    `UPDATE trade_sessions
     SET status = 'completed',
         completed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [Number(tradeId)]
  );

  saveDB();

  const p1 = await getPlayerBasic(trade.player1_id);
  const p2 = await getPlayerBasic(trade.player2_id);

  await createEvent({
    eventType: "trade_completed",
    title: "Player Trade Completed",
    message: `🤝 Trade completed between ${p1?.nickname || "Player1"} and ${p2?.nickname || "Player2"}`,
    metadata: {
      trade_id: Number(tradeId),
      player1_id: Number(trade.player1_id),
      player2_id: Number(trade.player2_id),
      player1_gold_offer: p1Gold,
      player2_gold_offer: p2Gold,
      item_count: state.items.length
    }
  });

  return {
    trade_id: Number(tradeId),
    status: "completed",
    player1_id: Number(trade.player1_id),
    player2_id: Number(trade.player2_id),
    player1_gold_offer: p1Gold,
    player2_gold_offer: p2Gold,
    transferred_items: state.items.length
  };
}

async function cancelTrade({ tradeId, playerId }) {
  const db = await initDB();

  const trade = await getTradeById(tradeId);
  if (!trade) throw new Error("trade not found");
  if (trade.status !== "pending") throw new Error("trade is not pending");

  if (
    Number(playerId) !== Number(trade.player1_id) &&
    Number(playerId) !== Number(trade.player2_id)
  ) {
    throw new Error("player does not belong to this trade");
  }

  db.run(
    `UPDATE trade_sessions
     SET status = 'cancelled',
         completed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [Number(tradeId)]
  );

  saveDB();

  return {
    trade_id: Number(tradeId),
    status: "cancelled"
  };
}

async function getTradesByPlayer(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, player1_id, player2_id, status, player1_accepted, player2_accepted, created_at, completed_at
     FROM trade_sessions
     WHERE player1_id = ?
        OR player2_id = ?
     ORDER BY id DESC`,
    [Number(playerId), Number(playerId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    trade_id: row[0],
    player1_id: row[1],
    player2_id: row[2],
    status: row[3],
    player1_accepted: Boolean(row[4]),
    player2_accepted: Boolean(row[5]),
    created_at: row[6],
    completed_at: row[7]
  }));
}

module.exports = {
  ensureTradeTables,
  createTrade,
  addTradeItem,
  addTradeGold,
  acceptTrade,
  cancelTrade,
  getTradesByPlayer,
  getTradeState
};
