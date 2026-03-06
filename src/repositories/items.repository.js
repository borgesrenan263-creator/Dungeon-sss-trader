const { initDB, saveDB } = require("../config/database");

async function ensureItemsTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rarity TEXT NOT NULL,
      slot TEXT NOT NULL,
      base_attack INTEGER DEFAULT 0,
      base_defense INTEGER DEFAULT 0,
      value_gold INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      upgrade_level INTEGER DEFAULT 0,
      equipped INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveDB();
}

async function seedItems() {
  const db = await initDB();

  const existing = db.exec(`SELECT COUNT(*) FROM items;`);
  const total = existing[0]?.values?.[0]?.[0] || 0;

  if (total > 0) return;

  db.run(`
    INSERT INTO items (name, rarity, slot, base_attack, base_defense, value_gold) VALUES
    ('Espada de Ferro', 'Comum', 'weapon', 10, 0, 500),
    ('Cajado Arcano', 'Raro', 'weapon', 18, 0, 1200),
    ('Arco do Vento', 'Raro', 'weapon', 16, 0, 1100),
    ('Armadura do Guardião', 'Épico', 'armor', 0, 20, 2500),
    ('Manto Astral', 'Épico', 'armor', 0, 14, 2200),
    ('Adaga SSS Sombria', 'SSS', 'weapon', 35, 0, 10000);
  `);

  saveDB();
}

async function getAllItems() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id, name, rarity, slot, base_attack, base_defense, value_gold
    FROM items
    ORDER BY id ASC;
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    name: row[1],
    rarity: row[2],
    slot: row[3],
    base_attack: row[4],
    base_defense: row[5],
    value_gold: row[6]
  }));
}

async function getItemById(itemId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, name, rarity, slot, base_attack, base_defense, value_gold
     FROM items
     WHERE id = ?;`,
    [Number(itemId)]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];

  return {
    id: row[0],
    name: row[1],
    rarity: row[2],
    slot: row[3],
    base_attack: row[4],
    base_defense: row[5],
    value_gold: row[6]
  };
}

async function giveItemToPlayer({ playerId, itemId }) {
  const db = await initDB();

  const playerResult = db.exec(
    `SELECT id, nickname FROM players WHERE id = ?;`,
    [Number(playerId)]
  );

  if (!playerResult.length || !playerResult[0].values.length) {
    throw new Error("player not found");
  }

  const itemResult = db.exec(
    `SELECT id, name, rarity, slot, base_attack, base_defense, value_gold
     FROM items
     WHERE id = ?;`,
    [Number(itemId)]
  );

  if (!itemResult.length || !itemResult[0].values.length) {
    throw new Error("item not found");
  }

  db.run(
    `INSERT INTO inventory (player_id, item_id, upgrade_level, equipped)
     VALUES (?, ?, 0, 0);`,
    [Number(playerId), Number(itemId)]
  );

  saveDB();

  const itemRow = itemResult[0].values[0];

  return {
    player_id: Number(playerId),
    item: {
      id: itemRow[0],
      name: itemRow[1],
      rarity: itemRow[2],
      slot: itemRow[3],
      base_attack: itemRow[4],
      base_defense: itemRow[5],
      value_gold: itemRow[6]
    }
  };
}

async function getPlayerInventory(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT inv.id, inv.player_id, inv.item_id, inv.upgrade_level, inv.equipped,
            it.name, it.rarity, it.slot, it.base_attack, it.base_defense, it.value_gold
     FROM inventory inv
     INNER JOIN items it ON it.id = inv.item_id
     WHERE inv.player_id = ?
     ORDER BY inv.id DESC;`,
    [Number(playerId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    inventory_id: row[0],
    player_id: row[1],
    item_id: row[2],
    upgrade_level: row[3],
    equipped: Boolean(row[4]),
    name: row[5],
    rarity: row[6],
    slot: row[7],
    base_attack: row[8],
    base_defense: row[9],
    value_gold: row[10]
  }));
}

module.exports = {
  ensureItemsTables,
  seedItems,
  getAllItems,
  getItemById,
  giveItemToPlayer,
  getPlayerInventory
};
