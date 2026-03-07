const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

const BASE_SLOTS = [
  { slot_key: "weapon", slot_name: "Weapon" },
  { slot_key: "helmet", slot_name: "Helmet" },
  { slot_key: "chest", slot_name: "Chest" },
  { slot_key: "boots", slot_name: "Boots" },
  { slot_key: "ring", slot_name: "Ring" },
  { slot_key: "amulet", slot_name: "Amulet" }
];

function normalizeItemSlot(rawSlot) {
  const slot = String(rawSlot || "").toLowerCase();

  if (slot === "weapon") return "weapon";
  if (slot === "helmet" || slot === "head") return "helmet";
  if (slot === "chest" || slot === "armor" || slot === "body") return "chest";
  if (slot === "boots" || slot === "feet") return "boots";
  if (slot === "ring") return "ring";
  if (slot === "amulet" || slot === "necklace") return "amulet";

  return null;
}

async function ensureEquipmentTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS equipment_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_key TEXT UNIQUE NOT NULL,
      slot_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS player_equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      slot_key TEXT NOT NULL,
      inventory_id INTEGER NOT NULL,
      equipped_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, slot_key)
    )
  `);

  saveDB();
}

async function seedEquipmentSlots() {
  const db = await initDB();

  for (const slot of BASE_SLOTS) {
    const existing = db.exec(
      `SELECT id FROM equipment_slots WHERE slot_key = ?`,
      [slot.slot_key]
    );

    if (existing.length && existing[0].values.length) continue;

    db.run(
      `INSERT INTO equipment_slots (
        slot_key,
        slot_name
      ) VALUES (?, ?)`,
      [slot.slot_key, slot.slot_name]
    );
  }

  saveDB();
}

async function getPlayerEquipment(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT pe.id, pe.player_id, pe.slot_key, pe.inventory_id, pe.equipped_at,
            i.name, i.rarity, i.slot, i.base_attack, i.base_defense, i.value_gold,
            inv.upgrade_level
     FROM player_equipment pe
     INNER JOIN inventory inv ON inv.id = pe.inventory_id
     INNER JOIN items i ON i.id = inv.item_id
     WHERE pe.player_id = ?
     ORDER BY pe.slot_key ASC`,
    [Number(playerId)]
  );

  if (!result.length) {
    return [];
  }

  return result[0].values.map((row) => ({
    equipment_id: row[0],
    player_id: row[1],
    slot_key: row[2],
    inventory_id: row[3],
    equipped_at: row[4],
    item_name: row[5],
    rarity: row[6],
    item_slot: row[7],
    base_attack: row[8],
    base_defense: row[9],
    value_gold: row[10],
    upgrade_level: row[11] || 0
  }));
}

async function equipItem({ playerId, inventoryId }) {
  const db = await initDB();

  const inventoryResult = db.exec(
    `SELECT inv.id, inv.player_id, inv.item_id, inv.upgrade_level, i.name, i.slot, i.base_attack, i.base_defense
     FROM inventory inv
     INNER JOIN items i ON i.id = inv.item_id
     WHERE inv.id = ?`,
    [Number(inventoryId)]
  );

  if (!inventoryResult.length || !inventoryResult[0].values.length) {
    throw new Error("inventory item not found");
  }

  const row = inventoryResult[0].values[0];

  if (Number(row[1]) !== Number(playerId)) {
    throw new Error("item does not belong to player");
  }

  const normalizedSlot = normalizeItemSlot(row[5]);
  if (!normalizedSlot) {
    throw new Error("item cannot be equipped");
  }

  const existing = db.exec(
    `SELECT id, inventory_id
     FROM player_equipment
     WHERE player_id = ?
       AND slot_key = ?`,
    [Number(playerId), normalizedSlot]
  );

  if (existing.length && existing[0].values.length) {
    const oldInventoryId = existing[0].values[0][1];

    db.run(
      `DELETE FROM player_equipment
       WHERE player_id = ?
         AND slot_key = ?`,
      [Number(playerId), normalizedSlot]
    );

    db.run(
      `UPDATE inventory
       SET equipped = 0
       WHERE id = ?`,
      [Number(oldInventoryId)]
    );
  }

  db.run(
    `INSERT INTO player_equipment (
      player_id,
      slot_key,
      inventory_id,
      equipped_at
    ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    [Number(playerId), normalizedSlot, Number(inventoryId)]
  );

  db.run(
    `UPDATE inventory
     SET equipped = 1
     WHERE id = ?`,
    [Number(inventoryId)]
  );

  saveDB();

  await createEvent({
    eventType: "equipment_changed",
    title: "Equipment Updated",
    message: `🛡️ Player ${playerId} equipped ${row[4]} in slot ${normalizedSlot}`,
    metadata: {
      player_id: Number(playerId),
      inventory_id: Number(inventoryId),
      slot_key: normalizedSlot
    }
  });

  return {
    player_id: Number(playerId),
    inventory_id: Number(inventoryId),
    slot_key: normalizedSlot,
    item_name: row[4],
    upgrade_level: Number(row[3] || 0)
  };
}

async function unequipItem({ playerId, slotKey }) {
  const db = await initDB();

  const safeSlot = normalizeItemSlot(slotKey);
  if (!safeSlot) {
    throw new Error("invalid slot");
  }

  const equipped = db.exec(
    `SELECT pe.id, pe.inventory_id, i.name
     FROM player_equipment pe
     INNER JOIN inventory inv ON inv.id = pe.inventory_id
     INNER JOIN items i ON i.id = inv.item_id
     WHERE pe.player_id = ?
       AND pe.slot_key = ?`,
    [Number(playerId), safeSlot]
  );

  if (!equipped.length || !equipped[0].values.length) {
    throw new Error("no equipped item in this slot");
  }

  const row = equipped[0].values[0];

  db.run(
    `DELETE FROM player_equipment
     WHERE player_id = ?
       AND slot_key = ?`,
    [Number(playerId), safeSlot]
  );

  db.run(
    `UPDATE inventory
     SET equipped = 0
     WHERE id = ?`,
    [Number(row[1])]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    slot_key: safeSlot,
    inventory_id: Number(row[1]),
    item_name: row[2],
    equipped: false
  };
}

async function getEquipmentStats(playerId) {
  const db = await initDB();

  const character = db.exec(
    `SELECT strength, dexterity, intelligence, vitality, stat_points
     FROM character_progression
     WHERE player_id = ?`,
    [Number(playerId)]
  );

  if (!character.length || !character[0].values.length) {
    throw new Error("character progression not found");
  }

  const base = character[0].values[0];
  const equipment = await getPlayerEquipment(playerId);

  let bonusAttack = 0;
  let bonusDefense = 0;
  let bonusHp = 0;

  for (const item of equipment) {
    const upgrade = Number(item.upgrade_level || 0);
    const baseAttack = Number(item.base_attack || 0);
    const baseDefense = Number(item.base_defense || 0);

    bonusAttack += baseAttack + upgrade * 2;
    bonusDefense += baseDefense + upgrade * 2;

    if (item.slot_key === "chest" || item.slot_key === "helmet" || item.slot_key === "boots") {
      bonusHp += 10 + upgrade * 5;
    }

    if (item.slot_key === "amulet") {
      bonusHp += 20 + upgrade * 5;
    }
  }

  const strength = Number(base[0]);
  const dexterity = Number(base[1]);
  const intelligence = Number(base[2]);
  const vitality = Number(base[3]);

  return {
    player_id: Number(playerId),
    attributes: {
      strength,
      dexterity,
      intelligence,
      vitality
    },
    equipment_bonus: {
      bonus_attack: bonusAttack,
      bonus_defense: bonusDefense,
      bonus_hp: bonusHp
    },
    final_stats: {
      attack_power: strength * 2 + dexterity + bonusAttack,
      magic_power: intelligence * 2,
      max_hp: 100 + vitality * 20 + bonusHp,
      crit_chance: dexterity,
      defense: vitality * 2 + bonusDefense
    },
    equipped_items: equipment
  };
}

module.exports = {
  ensureEquipmentTables,
  seedEquipmentSlots,
  getPlayerEquipment,
  equipItem,
  unequipItem,
  getEquipmentStats
};
