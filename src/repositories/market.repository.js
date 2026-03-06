const { initDB, saveDB } = require("../config/database");

async function ensureMarketTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS market_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_player_id INTEGER NOT NULL,
      inventory_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      price_usdt REAL NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS market_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      seller_player_id INTEGER NOT NULL,
      buyer_player_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      price_usdt REAL NOT NULL,
      dev_fee_usdt REAL NOT NULL,
      seller_receive_usdt REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveDB();
}

async function listItemForSale({ sellerPlayerId, inventoryId, priceUsdt }) {
  const db = await initDB();

  const invResult = db.exec(
    `SELECT id, player_id, item_id, upgrade_level, equipped
     FROM inventory
     WHERE id = ?;`,
    [Number(inventoryId)]
  );

  if (!invResult.length || !invResult[0].values.length) {
    throw new Error("inventory item not found");
  }

  const inv = invResult[0].values[0];

  if (Number(inv[1]) !== Number(sellerPlayerId)) {
    throw new Error("item does not belong to seller");
  }

  if (Number(inv[4]) === 1) {
    throw new Error("equipped item cannot be listed");
  }

  const activeListing = db.exec(
    `SELECT id
     FROM market_listings
     WHERE inventory_id = ?
       AND status = 'active';`,
    [Number(inventoryId)]
  );

  if (activeListing.length && activeListing[0].values.length) {
    throw new Error("item is already listed");
  }

  db.run(
    `INSERT INTO market_listings (
      seller_player_id,
      inventory_id,
      item_id,
      price_usdt,
      status
    ) VALUES (?, ?, ?, ?, 'active');`,
    [Number(sellerPlayerId), Number(inventoryId), Number(inv[2]), Number(priceUsdt)]
  );

  saveDB();

  return {
    seller_player_id: Number(sellerPlayerId),
    inventory_id: Number(inventoryId),
    item_id: Number(inv[2]),
    price_usdt: Number(priceUsdt),
    status: "active"
  };
}

async function getActiveListings() {
  const db = await initDB();

  const result = db.exec(`
    SELECT ml.id,
           ml.seller_player_id,
           ml.inventory_id,
           ml.item_id,
           ml.price_usdt,
           ml.status,
           it.name,
           it.rarity,
           it.slot,
           inv.upgrade_level
    FROM market_listings ml
    INNER JOIN items it ON it.id = ml.item_id
    INNER JOIN inventory inv ON inv.id = ml.inventory_id
    WHERE ml.status = 'active'
    ORDER BY ml.id DESC;
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    listing_id: row[0],
    seller_player_id: row[1],
    inventory_id: row[2],
    item_id: row[3],
    price_usdt: row[4],
    status: row[5],
    item_name: row[6],
    rarity: row[7],
    slot: row[8],
    upgrade_level: row[9]
  }));
}

async function buyListing({ buyerPlayerId, listingId }) {
  const db = await initDB();

  const listingResult = db.exec(
    `SELECT id, seller_player_id, inventory_id, item_id, price_usdt, status
     FROM market_listings
     WHERE id = ?;`,
    [Number(listingId)]
  );

  if (!listingResult.length || !listingResult[0].values.length) {
    throw new Error("listing not found");
  }

  const listing = listingResult[0].values[0];

  if (listing[5] !== "active") {
    throw new Error("listing is not active");
  }

  const sellerPlayerId = Number(listing[1]);
  const inventoryId = Number(listing[2]);
  const itemId = Number(listing[3]);
  const priceUsdt = Number(listing[4]);
  const buyerId = Number(buyerPlayerId);

  if (buyerId === sellerPlayerId) {
    throw new Error("seller cannot buy own item");
  }

  const buyerWallet = db.exec(
    `SELECT usdt
     FROM currencies
     WHERE player_id = ?;`,
    [buyerId]
  );

  if (!buyerWallet.length || !buyerWallet[0].values.length) {
    throw new Error("buyer wallet not found");
  }

  const buyerUsdt = Number(buyerWallet[0].values[0][0] || 0);

  if (buyerUsdt < priceUsdt) {
    throw new Error("insufficient usdt");
  }

  const devFee = Number((priceUsdt * 0.10).toFixed(2));
  const sellerReceive = Number((priceUsdt - devFee).toFixed(2));

  db.run(
    `UPDATE currencies
     SET usdt = usdt - ?
     WHERE player_id = ?;`,
    [priceUsdt, buyerId]
  );

  db.run(
    `UPDATE currencies
     SET usdt = usdt + ?
     WHERE player_id = ?;`,
    [sellerReceive, sellerPlayerId]
  );

  db.run(
    `UPDATE inventory
     SET player_id = ?
     WHERE id = ?;`,
    [buyerId, inventoryId]
  );

  db.run(
    `UPDATE market_listings
     SET status = 'sold'
     WHERE id = ?;`,
    [Number(listingId)]
  );

  db.run(
    `INSERT INTO market_sales (
      listing_id,
      seller_player_id,
      buyer_player_id,
      item_id,
      price_usdt,
      dev_fee_usdt,
      seller_receive_usdt
    ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      Number(listingId),
      sellerPlayerId,
      buyerId,
      itemId,
      priceUsdt,
      devFee,
      sellerReceive
    ]
  );

  saveDB();

  return {
    listing_id: Number(listingId),
    seller_player_id: sellerPlayerId,
    buyer_player_id: buyerId,
    item_id: itemId,
    price_usdt: priceUsdt,
    dev_fee_usdt: devFee,
    seller_receive_usdt: sellerReceive,
    transferred_inventory_id: inventoryId
  };
}

async function getMarketSales() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id,
           listing_id,
           seller_player_id,
           buyer_player_id,
           item_id,
           price_usdt,
           dev_fee_usdt,
           seller_receive_usdt,
           created_at
    FROM market_sales
    ORDER BY id DESC;
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    listing_id: row[1],
    seller_player_id: row[2],
    buyer_player_id: row[3],
    item_id: row[4],
    price_usdt: row[5],
    dev_fee_usdt: row[6],
    seller_receive_usdt: row[7],
    created_at: row[8]
  }));
}

module.exports = {
  ensureMarketTables,
  listItemForSale,
  getActiveListings,
  buyListing,
  getMarketSales
};
