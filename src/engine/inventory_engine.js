const {
  getPlayerByName: getPlayerFromState,
  ensurePlayer
} = require("./game_state");

function createInventory() {
  return {
    equipments: [],
    materials: [],
    consumables: [],
    drops: []
  };
}

function touchInventory(inventory) {
  if (!inventory.equipments) inventory.equipments = [];
  if (!inventory.materials) inventory.materials = [];
  if (!inventory.consumables) inventory.consumables = [];
  if (!inventory.drops) inventory.drops = [];
  return inventory;
}

function getOrCreatePlayer(name) {
  return getPlayerFromState(name) || ensurePlayer(name, name);
}

function normalizeItem(item) {
  if (typeof item === "string") {
    return {
      id: item,
      type: item,
      name: item
    };
  }

  return {
    id: item?.id || item?.type || item?.name || "item",
    type: item?.type || item?.id || item?.name || "item",
    name: item?.name || item?.type || item?.id || "item"
  };
}

function addItemToInventory(inventory, item) {
  touchInventory(inventory);
  const normalized = normalizeItem(item);
  inventory.equipments.push(normalized);

  return {
    ok: true,
    item: normalized
  };
}

function addDropToInventory(inventory, item) {
  touchInventory(inventory);
  const normalized = normalizeItem(item);

  if (
    normalized.type === "equipment" ||
    normalized.type === "weapon" ||
    normalized.type === "armor" ||
    normalized.type === "accessory"
  ) {
    inventory.equipments.push(normalized);
    return { ok: true, item: normalized };
  }

  if (normalized.type === "material") {
    inventory.materials.push(normalized);
    inventory.drops.push(normalized);
    return { ok: true, item: normalized };
  }

  inventory.drops.push(normalized);
  return { ok: true, item: normalized };
}

function removeMaterial(inventory, id) {
  touchInventory(inventory);

  const removeOne = (arr) => {
    const index = arr.findIndex(
      (x) => x.id === id || x.type === id || x.name === id
    );

    if (index >= 0) {
      arr.splice(index, 1);
      return true;
    }

    return false;
  };

  const removedDrops = removeOne(inventory.drops);
  const removedMaterials = removeOne(inventory.materials);

  return removedDrops || removedMaterials;
}

function consumeMaterial(inventory, id, amount = 1) {
  let consumed = 0;

  while (consumed < amount) {
    const removed = removeMaterial(inventory, id);
    if (!removed) break;
    consumed++;
  }

  return consumed === amount;
}

function countMaterial(inventory, id) {
  return (inventory?.drops || []).filter(
    (x) => x.id === id || x.type === id || x.name === id
  ).length;
}

module.exports = {
  createInventory,
  getPlayerByName: getOrCreatePlayer,
  addItemToInventory,
  addDropToInventory,
  removeMaterial,
  consumeMaterial,
  countMaterial
};
