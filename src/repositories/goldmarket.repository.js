const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

async function ensureGoldMarketTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS gold_market_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_player_id INTEGER NOT NULL,
      inventory_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      price_gold INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS gold_market_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      seller_player_id INTEGER NOT NULL,
      buyer_player_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      price_gold INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function createGoldListing({ sellerPlayerId, inventoryId, priceGold }) {
  const db = await initDB();

  const inv = db.exec(
    `SELECT id, player_id, item_id, upgrade_level
     FROM inventory
     WHERE id = ?`,
    [Number(inventoryId)]
  );

  if (!inv.length || !inv[0].values.length) {
    throw new Error("inventory item not found");
  }

  const item = inv[0].values[0];

  if (Number(item[1]) !== Number(sellerPlayerId)) {
    throw new Error("item does not belong to seller");
  }

  const safePrice = Number(priceGold) || 0;
  if (safePrice <= 0) {
    throw new Error("invalid gold price");
  }

  db.run(
    `INSERT INTO gold_market_listings
     (seller_player_id, inventory_id, item_id, price_gold, status, created_at)
     VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`,
    [
      Number(sellerPlayerId),
      Number(inventoryId),
      Number(item[2]),
      safePrice
    ]
  );

  saveDB();

  return {
    seller_player_id: Number(sellerPlayerId),
    inventory_id: Number(inventoryId),
    item_id: Number(item[2]),
    price_gold: safePrice,
    status: "active"
  };
}

async function getGoldListings() {
  const db = await initDB();

  const result = db.exec(`
    SELECT
      gml.id,
      gml.seller_player_id,
      gml.inventory_id,
      gml.item_id,
      gml.price_gold,
      gml.status,
      gml.created_at,
      it.name,
      it.rarity,
      inv.upgrade_level
    FROM gold_market_listings gml
    LEFT JOIN items it ON it.id = gml.item_id
    LEFT JOIN inventory inv ON inv.id = gml.inventory_id
    WHERE gml.status = 'active'
    ORDER BY gml.id DESC
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    listing_id: row[0],
    seller_player_id: row[1],
    inventory_id: row[2],
    item_id: row[3],
    price_gold: row[4],
    status: row[5],
    created_at: row[6],
    item_name: row[7],
    rarity: row[8],
    upgrade_level: row[9] || 0
  }));
}

async function buyGoldListing({ buyerPlayerId, listingId }) {
  const db = await initDB();

  const listingResult = db.exec(
    `SELECT id, seller_player_id, inventory_id, item_id, price_gold, status
     FROM gold_market_listings
     WHERE id = ?`,
    [Number(listingId)]
  );

  if (!listingResult.length || !listingResult[0].values.length) {
    throw new Error("listing not found");
  }

  const listing = listingResult[0].values[0];

  if (listing[5] !== "active") {
    throw new Error("listing is not active");
  }

  if (Number(listing[1]) === Number(buyerPlayerId)) {
    throw new Error("seller cannot buy own listing");
  }

  const buyerCurrency = db.exec(
    `SELECT gold
     FROM currencies
     WHERE player_id = ?`,
    [Number(buyerPlayerId)]
  );

  if (!buyerCurrency.length || !buyerCurrency[0].values.length) {
    throw new Error("buyer wallet not found");
  }

  const buyerGold = Number(buyerCurrency[0].values[0][0] || 0);
  const priceGold = Number(listing[4]);

  if (buyerGold < priceGold) {
    throw new Error("insufficient gold");
  }

  db.run(
    `UPDATE currencies
     SET gold = gold - ?
     WHERE player_id = ?`,
    [priceGold, Number(buyerPlayerId)]
  );

  db.run(
    `UPDATE currencies
     SET gold = gold + ?
     WHERE player_id = ?`,
    [priceGold, Number(listing[1])]
  );

  db.run(
    `UPDATE inventory
     SET player_id = ?, equipped = 0
     WHERE id = ?`,
    [Number(buyerPlayerId), Number(listing[2])]
  );

  db.run(
    `UPDATE gold_market_listings
     SET status = 'sold'
     WHERE id = ?`,
    [Number(listingId)]
  );

  db.run(
    `INSERT INTO gold_market_sales
     (listing_id, seller_player_id, buyer_player_id, item_id, price_gold, created_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      Number(listingId),
      Number(listing[1]),
      Number(buyerPlayerId),
      Number(listing[3]),
      priceGold
    ]
  );

  saveDB();

  const sellerInfo = db.exec(`SELECT nickname FROM players WHERE id = ?`, [Number(listing[1])]);
  const buyerInfo = db.exec(`SELECT nickname FROM players WHERE id = ?`, [Number(buyerPlayerId)]);
  const itemInfo = db.exec(`SELECT name FROM items WHERE id = ?`, [Number(listing[3])]);

  const sellerNickname = sellerInfo.length && sellerInfo[0].values.length ? sellerInfo[0].values[0][0] : "Unknown";
  const buyerNickname = buyerInfo.length && buyerInfo[0].values.length ? buyerInfo[0].values[0][0] : "Unknown";
  const itemName = itemInfo.length && itemInfo[0].values.length ? itemInfo[0].values[0][0] : "Unknown Item";

  await createEvent({
    eventType: "gold_market_sale",
    title: "Gold Market Sale",
    message: `💰 ${itemName} sold by ${sellerNickname} to ${buyerNickname} for ${priceGold} gold`,
    metadata: {
      listing_id: Number(listingId),
      seller_player_id: Number(listing[1]),
      buyer_player_id: Number(buyerPlayerId),
      item_id: Number(listing[3]),
      item_name: itemName,
      price_gold: priceGold
    }
  });

  return {
    listing_id: Number(listingId),
    seller_player_id: Number(listing[1]),
    buyer_player_id: Number(buyerPlayerId),
    item_id: Number(listing[3]),
    price_gold: priceGold,
    transferred_inventory_id: Number(listing[2])
  };
}

async function getGoldSales() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id, listing_id, seller_player_id, buyer_player_id, item_id, price_gold, created_at
    FROM gold_market_sales
    ORDER BY id DESC
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    listing_id: row[1],
    seller_player_id: row[2],
    buyer_player_id: row[3],
    item_id: row[4],
    price_gold: row[5],
    created_at: row[6]
  }));
}

module.exports = {
  ensureGoldMarketTables,
  createGoldListing,
  getGoldListings,
  buyGoldListing,
  getGoldSales
};
