const { initDB, saveDB } = require("../config/database");

const FREE_TAB_SLOTS = 40;
const PAID_TAB_PRICE_USDT = 10;

async function ensureStorageTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS storage_tabs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      tab_number INTEGER NOT NULL,
      unlocked INTEGER DEFAULT 0,
      price_usdt REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS player_storage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      tab_number INTEGER NOT NULL,
      slot_number INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      inventory_ref_id INTEGER,
      upgrade_level INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function ensurePlayerStorageBase(playerId) {
  const db = await initDB();

  const existing = db.exec(
    `SELECT tab_number
     FROM storage_tabs
     WHERE player_id = ?
     ORDER BY tab_number ASC;`,
    [Number(playerId)]
  );

  const tabs = existing.length ? existing[0].values.map((row) => Number(row[0])) : [];

  if (!tabs.includes(1)) {
    db.run(
      `INSERT INTO storage_tabs (player_id, tab_number, unlocked, price_usdt)
       VALUES (?, 1, 1, 0);`,
      [Number(playerId)]
    );
  }

  if (!tabs.includes(2)) {
    db.run(
      `INSERT INTO storage_tabs (player_id, tab_number, unlocked, price_usdt)
       VALUES (?, 2, 0, ?);`,
      [Number(playerId), Number(PAID_TAB_PRICE_USDT)]
    );
  }

  if (!tabs.includes(3)) {
    db.run(
      `INSERT INTO storage_tabs (player_id, tab_number, unlocked, price_usdt)
       VALUES (?, 3, 0, ?);`,
      [Number(playerId), Number(PAID_TAB_PRICE_USDT)]
    );
  }

  saveDB();
}

async function getStorageStatus(playerId) {
  const db = await initDB();

  await ensurePlayerStorageBase(playerId);

  const tabsResult = db.exec(
    `SELECT tab_number, unlocked, price_usdt
     FROM storage_tabs
     WHERE player_id = ?
     ORDER BY tab_number ASC;`,
    [Number(playerId)]
  );

  const tabs = tabsResult.length
    ? tabsResult[0].values.map((row) => ({
        tab_number: row[0],
        unlocked: Boolean(row[1]),
        slots: FREE_TAB_SLOTS,
        price_usdt: Number(row[2])
      }))
    : [];

  return {
    player_id: Number(playerId),
    tabs
  };
}

async function unlockStorageTab({ playerId, tabNumber }) {
  const db = await initDB();

  const safeTab = Number(tabNumber);

  if (![2, 3].includes(safeTab)) {
    throw new Error("only tab 2 or 3 can be unlocked");
  }

  await ensurePlayerStorageBase(playerId);

  const tabResult = db.exec(
    `SELECT unlocked, price_usdt
     FROM storage_tabs
     WHERE player_id = ?
       AND tab_number = ?;`,
    [Number(playerId), safeTab]
  );

  if (!tabResult.length || !tabResult[0].values.length) {
    throw new Error("storage tab not found");
  }

  const unlocked = Number(tabResult[0].values[0][0]);
  const priceUsdt = Number(tabResult[0].values[0][1]);

  if (unlocked === 1) {
    throw new Error("tab already unlocked");
  }

  const walletResult = db.exec(
    `SELECT usdt
     FROM currencies
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  if (!walletResult.length || !walletResult[0].values.length) {
    throw new Error("player wallet not found");
  }

  const currentUsdt = Number(walletResult[0].values[0][0] || 0);

  if (currentUsdt < priceUsdt) {
    throw new Error("insufficient usdt");
  }

  db.run(
    `UPDATE currencies
     SET usdt = usdt - ?
     WHERE player_id = ?;`,
    [priceUsdt, Number(playerId)]
  );

  db.run(
    `UPDATE storage_tabs
     SET unlocked = 1
     WHERE player_id = ?
       AND tab_number = ?;`,
    [Number(playerId), safeTab]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    tab_number: safeTab,
    unlocked: true,
    price_paid_usdt: priceUsdt
  };
}

async function getTabOccupancy(playerId, tabNumber) {
  const db = await initDB();

  const result = db.exec(
    `SELECT COUNT(*)
     FROM player_storage
     WHERE player_id = ?
       AND tab_number = ?;`,
    [Number(playerId), Number(tabNumber)]
  );

  return Number(result[0]?.values?.[0]?.[0] || 0);
}

async function depositItem({ playerId, inventoryId, tabNumber, slotNumber }) {
  const db = await initDB();

  const safeTab = Number(tabNumber);
  const safeSlot = Number(slotNumber);

  if (![1, 2, 3].includes(safeTab)) {
    throw new Error("invalid tab number");
  }

  if (safeSlot < 1 || safeSlot > FREE_TAB_SLOTS) {
    throw new Error("slot must be between 1 and 40");
  }

  await ensurePlayerStorageBase(playerId);

  const tabResult = db.exec(
    `SELECT unlocked
     FROM storage_tabs
     WHERE player_id = ?
       AND tab_number = ?;`,
    [Number(playerId), safeTab]
  );

  if (!tabResult.length || !tabResult[0].values.length) {
    throw new Error("storage tab not found");
  }

  const unlocked = Number(tabResult[0].values[0][0]);

  if (unlocked !== 1) {
    throw new Error("storage tab is locked");
  }

  const slotUsed = db.exec(
    `SELECT id
     FROM player_storage
     WHERE player_id = ?
       AND tab_number = ?
       AND slot_number = ?;`,
    [Number(playerId), safeTab, safeSlot]
  );

  if (slotUsed.length && slotUsed[0].values.length) {
    throw new Error("slot already occupied");
  }

  const inventoryResult = db.exec(
    `SELECT id, player_id, item_id, upgrade_level
     FROM inventory
     WHERE id = ?;`,
    [Number(inventoryId)]
  );

  if (!inventoryResult.length || !inventoryResult[0].values.length) {
    throw new Error("inventory item not found");
  }

  const inv = inventoryResult[0].values[0];

  if (Number(inv[1]) !== Number(playerId)) {
    throw new Error("item does not belong to player");
  }

  db.run(
    `INSERT INTO player_storage (
      player_id,
      tab_number,
      slot_number,
      item_id,
      inventory_ref_id,
      upgrade_level
     ) VALUES (?, ?, ?, ?, ?, ?);`,
    [
      Number(playerId),
      safeTab,
      safeSlot,
      Number(inv[2]),
      Number(inv[0]),
      Number(inv[3])
    ]
  );

  db.run(
    `DELETE FROM inventory
     WHERE id = ?;`,
    [Number(inventoryId)]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    tab_number: safeTab,
    slot_number: safeSlot,
    item_id: Number(inv[2]),
    upgrade_level: Number(inv[3]),
    moved_from_inventory_id: Number(inv[0])
  };
}

async function withdrawItem({ playerId, storageId }) {
  const db = await initDB();

  const storageResult = db.exec(
    `SELECT id, player_id, tab_number, slot_number, item_id, upgrade_level
     FROM player_storage
     WHERE id = ?;`,
    [Number(storageId)]
  );

  if (!storageResult.length || !storageResult[0].values.length) {
    throw new Error("storage item not found");
  }

  const item = storageResult[0].values[0];

  if (Number(item[1]) !== Number(playerId)) {
    throw new Error("storage item does not belong to player");
  }

  db.run(
    `INSERT INTO inventory (player_id, item_id, upgrade_level, equipped)
     VALUES (?, ?, ?, 0);`,
    [Number(playerId), Number(item[4]), Number(item[5])]
  );

  db.run(
    `DELETE FROM player_storage
     WHERE id = ?;`,
    [Number(storageId)]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    storage_id: Number(item[0]),
    withdrawn_item_id: Number(item[4]),
    upgrade_level: Number(item[5]),
    from_tab: Number(item[2]),
    from_slot: Number(item[3])
  };
}

async function getStorageContents(playerId) {
  const db = await initDB();

  await ensurePlayerStorageBase(playerId);

  const result = db.exec(
    `SELECT ps.id,
            ps.player_id,
            ps.tab_number,
            ps.slot_number,
            ps.item_id,
            ps.upgrade_level,
            it.name,
            it.rarity,
            it.slot,
            it.base_attack,
            it.base_defense,
            it.value_gold
     FROM player_storage ps
     INNER JOIN items it ON it.id = ps.item_id
     WHERE ps.player_id = ?
     ORDER BY ps.tab_number ASC, ps.slot_number ASC;`,
    [Number(playerId)]
  );

  if (!result.length) {
    return {
      player_id: Number(playerId),
      total_items: 0,
      items: []
    };
  }

  return {
    player_id: Number(playerId),
    total_items: result[0].values.length,
    items: result[0].values.map((row) => ({
      storage_id: row[0],
      player_id: row[1],
      tab_number: row[2],
      slot_number: row[3],
      item_id: row[4],
      upgrade_level: row[5],
      name: row[6],
      rarity: row[7],
      slot: row[8],
      base_attack: row[9],
      base_defense: row[10],
      value_gold: row[11]
    }))
  };
}

module.exports = {
  FREE_TAB_SLOTS,
  PAID_TAB_PRICE_USDT,
  ensureStorageTables,
  getStorageStatus,
  unlockStorageTab,
  depositItem,
  withdrawItem,
  getStorageContents
};
