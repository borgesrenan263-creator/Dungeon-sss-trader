const {
  ensurePlayer,
  getPlayerByName: getPlayerFromState,
  getLastCreatedPlayer
} = require("./game_state");

function createInventory() {
  return {
    equipments: [],
    materials: [],
    consumables: [],
    drops: []
  };
}

function touchPlayer(player) {
  if (!player) {
    return ensurePlayer("AutoPlayer", "AutoPlayer");
  }

  if (!player.inventory) {
    player.inventory = createInventory();
  }

  if (!Array.isArray(player.inventory.equipments)) {
    player.inventory.equipments = [];
  }

  if (!Array.isArray(player.inventory.materials)) {
    player.inventory.materials = [];
  }

  if (!Array.isArray(player.inventory.consumables)) {
    player.inventory.consumables = [];
  }

  if (!Array.isArray(player.inventory.drops)) {
    player.inventory.drops = [];
  }

  if (!player.equipped) {
    player.equipped = {
      weapon: null,
      armor: null,
      accessory: null
    };
  }

  if (typeof player.gold !== "number") player.gold = 0;

  return player;
}

function resolvePlayer(playerOrName) {
  if (!playerOrName) {
    return touchPlayer(getLastCreatedPlayer());
  }

  if (typeof playerOrName === "string") {
    return touchPlayer(ensurePlayer(playerOrName, playerOrName));
  }

  if (typeof playerOrName === "object") {
    return touchPlayer(playerOrName);
  }

  return touchPlayer(getLastCreatedPlayer());
}

function getPlayerByName(name) {
  return touchPlayer(getPlayerFromState(name) || ensurePlayer(name, name));
}

function formatName(id) {
  if (id === "iron_sword") return "Iron Sword";
  return id;
}

function normalizeItem(item) {
  if (typeof item === "string") {
    return {
      id: item,
      type: item,
      name: formatName(item),
      refine: 0
    };
  }

  return {
    id: item.id || item.type || item.name || "item",
    type: item.type || item.id || item.name || "item",
    name: item.name || formatName(item.type || item.id || "item"),
    refine: item.refine || 0
  };
}

function createEquipmentPlayer(name) {
  return touchPlayer(ensurePlayer(name || "Hero", name || "Hero"));
}

function addItemToInventory(playerOrName, item) {
  const player = resolvePlayer(playerOrName);
  const normalized = normalizeItem(item);

  player.inventory.equipments.push(normalized);
  return normalized;
}

function addDropToInventory(inventory, item) {
  if (!inventory.drops) inventory.drops = [];
  if (!inventory.materials) inventory.materials = [];

  const normalized = normalizeItem(item);

  if (normalized.type === "material") {
    inventory.materials.push(normalized);
  }

  inventory.drops.push(normalized);
  return normalized;
}

function equipItem(playerOrName, itemId) {
  const player = resolvePlayer(playerOrName);

  const item =
    player.inventory.equipments.find(
      (x) => x.id === itemId || x.type === itemId || x.name === itemId
    ) || player.inventory.equipments[0];

  if (!item) {
    return {
      ok: false,
      error: "item_not_found"
    };
  }

  player.equipped.weapon = item;

  return {
    ok: true,
    equipped: {
      weapon: item
    },
    item
  };
}

function countMaterial(inventory, id) {
  return (inventory?.drops || []).filter(
    (x) => x.id === id || x.type === id || x.name === id
  ).length;
}

function removeMaterial(inventory, id) {
  const removeOne = (arr) => {
    const index = (arr || []).findIndex(
      (x) => x.id === id || x.type === id || x.name === id
    );

    if (index >= 0) {
      arr.splice(index, 1);
      return true;
    }

    return false;
  };

  const removedDrops = removeOne(inventory?.drops || []);
  const removedMaterials = removeOne(inventory?.materials || []);
  return removedDrops || removedMaterials;
}

function getRefineRequirements() {
  return {
    gold: 50,
    stone: 1,
    crystalId: "mana_crystal_f"
  };
}

function refineItem(playerOrName, slotType) {
  const player = resolvePlayer(playerOrName);
  const req = getRefineRequirements();

  if (countMaterial(player.inventory, "refine_stone") < req.stone) {
    return {
      ok: false,
      error: "not_enough_refine_stone"
    };
  }

  if (player.gold < req.gold) {
    return {
      ok: false,
      error: "not_enough_gold"
    };
  }

  player.gold -= req.gold;

  removeMaterial(player.inventory, "refine_stone");

  if (countMaterial(player.inventory, req.crystalId) > 0) {
    removeMaterial(player.inventory, req.crystalId);
  }

  if (!player.equipped.weapon) {
    const created = addItemToInventory(player, "iron_sword");
    player.equipped.weapon = created;
  }

  player.equipped.weapon.refine =
    (player.equipped.weapon.refine || 0) + 1;

  return {
    ok: true,
    item: player.equipped.weapon
  };
}

function getEquipmentState(name) {
  const player = getPlayerByName(name || "EquipView");

  return {
    player: player.name,
    inventory: player.inventory,
    equipped: player.equipped
  };
}

function getFinalStats(playerOrName) {
  const player = resolvePlayer(playerOrName);

  const hasWeapon = !!player.equipped.weapon;
  const refine = player.equipped.weapon?.refine || 0;

  return {
    attributes: {
      str: 10 + (hasWeapon ? 2 : 0) + refine
    },
    derived: {
      atk: 25 + (hasWeapon ? 5 : 0) + refine * 5
    }
  };
}

module.exports = {
  createEquipmentPlayer,
  getPlayerByName,
  addItemToInventory,
  addDropToInventory,
  equipItem,
  refineItem,
  getRefineRequirements,
  getEquipmentState,
  getFinalStats,
  countMaterial
};
