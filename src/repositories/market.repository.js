const { initDB, saveDB } = require("../config/database");

async function ensureMarketTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS market_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_player_id INTEGER NOT NULL,
      inventory_id INTEGER NOT NULL,
      item_id INTEGER,
      price_usdt REAL NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS market_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      seller_player_id INTEGER NOT NULL,
      buyer_player_id INTEGER,
      item_id INTEGER,
      price_usdt REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function createListing(playerId, inventoryId, priceUsdt) {
  const db = await initDB();

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

  if (Number(row[1]) !== Number(playerId)) {
    throw new Error("item does not belong to seller");
  }

  db.run(
    `INSERT INTO market_listings
     (seller_player_id, inventory_id, item_id, price_usdt, status, created_at)
     VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`,
    [Number(playerId), Number(inventoryId), Number(row[2]), Number(priceUsdt)]
  );

  saveDB();

  return {
    seller_player_id: Number(playerId),
    inventory_id: Number(inventoryId),
    item_id: Number(row[2]),
    price_usdt: Number(priceUsdt),
    status: "active"
  };
}

async function getActiveListings() {
  const db = await initDB();

  const result = db.exec(`
    SELECT
      id,
      seller_player_id,
      inventory_id,
      item_id,
      price_usdt,
      status,
      created_at
    FROM market_listings
    WHERE status = 'active'
    ORDER BY id DESC
  `);

  if (!result.length) {
    return [];
  }

  return result[0].values.map((row) => ({
    listing_id: row[0],
    seller_player_id: row[1],
    inventory_id: row[2],
    item_id: row[3],
    price_usdt: row[4],
    status: row[5],
    created_at: row[6]
  }));
}

async function buyListing(listingId) {
  const db = await initDB();

  const listing = db.exec(
    `SELECT id, seller_player_id, inventory_id, item_id, price_usdt, status
     FROM market_listings
     WHERE id = ?`,
    [Number(listingId)]
  );

  if (!listing.length || !listing[0].values.length) {
    throw new Error("listing not found");
  }

  const row = listing[0].values[0];

  if (row[5] !== "active") {
    throw new Error("listing is not active");
  }

  db.run(
    `UPDATE market_listings
     SET status = 'sold'
     WHERE id = ?`,
    [Number(listingId)]
  );

  db.run(
    `INSERT INTO market_sales
     (listing_id, seller_player_id, buyer_player_id, item_id, price_usdt, created_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [Number(row[0]), Number(row[1]), null, Number(row[3] || 0), Number(row[4])]
  );

  saveDB();

  return {
    listing_id: Number(row[0]),
    result: "sold",
    price_usdt: Number(row[4])
  };
}

module.exports = {
  ensureMarketTables,
  createListing,
  getActiveListings,
  buyListing
};
