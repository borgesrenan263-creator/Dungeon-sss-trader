const { EQUIPMENT_DB } = require("./equipment_db");
const { createBaseAttributes, calculateDerivedStats } = require("./attribute_engine");
const { countMaterial, consumeMaterial } = require("./inventory_engine");

function createEquipmentPlayer(name = "Hero") {
  return {
    name,
    attributes: createBaseAttributes(),
    gold: 0,
    inventory: {
      equipments: [],
      materials: []
    },
    equipped: {
      weapon: null,
      armor: null,
      ring: null
    }
  };
}

function cloneItem(itemId) {
  const item = EQUIPMENT_DB[itemId];

  if (!item) return null;

  return {
    ...item,
    refine: 0
  };
}

function addItemToInventory(player, itemId) {
  const item = cloneItem(itemId);

  if (!item) {
    return { ok: false, error: "item_not_found" };
  }

  player.inventory.equipments.push(item);

  return { ok: true, item };
}

function equipItem(player, itemId) {
  const itemIndex = player.inventory.equipments.findIndex((item) => item.id === itemId);

  if (itemIndex === -1) {
    return { ok: false, error: "item_not_in_inventory" };
  }

  const item = player.inventory.equipments[itemIndex];
  const slot = item.slot;

  if (player.equipped[slot]) {
    player.inventory.equipments.push(player.equipped[slot]);
  }

  player.equipped[slot] = item;
  player.inventory.equipments.splice(itemIndex, 1);

  return {
    ok: true,
    equipped: item.name,
    slot
  };
}

function unequipItem(player, slot) {
  const equippedItem = player.equipped[slot];

  if (!equippedItem) {
    return { ok: false, error: "empty_slot" };
  }

  player.inventory.equipments.push(equippedItem);
  player.equipped[slot] = null;

  return { ok: true };
}

function rollRefineSuccess(currentRefine) {
  const chances = {
    0: 1.0,
    1: 0.9,
    2: 0.7,
    3: 0.5,
    4: 0.3
  };

  const chance = chances[currentRefine] ?? 0.2;
  return Math.random() < chance;
}

function getRefineRequirements(currentRefine) {
  const map = {
    0: { gold: 50,  stone: 1, crystalId: "mana_crystal_f", crystalAmount: 1 },
    1: { gold: 100, stone: 1, crystalId: "mana_crystal_f", crystalAmount: 2 },
    2: { gold: 180, stone: 2, crystalId: "mana_crystal_e", crystalAmount: 1 },
    3: { gold: 300, stone: 2, crystalId: "mana_crystal_e", crystalAmount: 2 },
    4: { gold: 500, stone: 3, crystalId: "mana_crystal_e", crystalAmount: 3 }
  };

  return map[currentRefine] || null;
}

function refineItem(player, slot) {
  const item = player.equipped[slot];

  if (!item) {
    return { ok: false, error: "no_item_equipped" };
  }

  if (item.refine >= 5) {
    return { ok: false, error: "max_refine" };
  }

  const req = getRefineRequirements(item.refine);

  if (!req) {
    return { ok: false, error: "invalid_refine_state" };
  }

  if (player.gold < req.gold) {
    return { ok: false, error: "not_enough_gold" };
  }

  if (countMaterial(player.inventory, "refine_stone") < req.stone) {
    return { ok: false, error: "not_enough_refine_stone" };
  }

  if (countMaterial(player.inventory, req.crystalId) < req.crystalAmount) {
    return { ok: false, error: "not_enough_crystal" };
  }

  player.gold -= req.gold;
  consumeMaterial(player.inventory, "refine_stone", req.stone);
  consumeMaterial(player.inventory, req.crystalId, req.crystalAmount);

  const success = rollRefineSuccess(item.refine);

  if (!success) {
    return {
      ok: false,
      failed: true,
      refine: item.refine,
      cost: req
    };
  }

  item.refine += 1;

  return {
    ok: true,
    refine: item.refine,
    cost: req
  };
}

function getItemTotalBonus(item) {
  if (!item) {
    return { str: 0, dex: 0, int: 0, vit: 0 };
  }

  const refineBonus = item.refine || 0;

  return {
    str: item.bonus.str + refineBonus,
    dex: item.bonus.dex + refineBonus,
    int: item.bonus.int + refineBonus,
    vit: item.bonus.vit + refineBonus
  };
}

function getFinalAttributes(player) {
  const base = { ...player.attributes };

  for (const slot of Object.keys(player.equipped)) {
    const item = player.equipped[slot];
    const bonus = getItemTotalBonus(item);

    base.str += bonus.str;
    base.dex += bonus.dex;
    base.int += bonus.int;
    base.vit += bonus.vit;
  }

  return base;
}

function getFinalStats(player) {
  const finalAttributes = getFinalAttributes(player);
  const derived = calculateDerivedStats(finalAttributes);

  return {
    attributes: finalAttributes,
    derived
  };
}

module.exports = {
  createEquipmentPlayer,
  addItemToInventory,
  equipItem,
  unequipItem,
  refineItem,
  getRefineRequirements,
  getFinalAttributes,
  getFinalStats
};
