function createInventory() {
  return {
    items: [],
    equipped: {
      weapon: null,
      armor: null
    }
  };
}

function addItem(inventory, item) {
  inventory.items.push(item);
  return inventory;
}

function equipItem(inventory, itemName) {
  const item = inventory.items.find(i => i.item === itemName);

  if (!item) {
    throw new Error("item_not_found");
  }

  if (item.rarity === "legendary" || item.item.includes("Sword")) {
    inventory.equipped.weapon = item;
  } else {
    inventory.equipped.armor = item;
  }

  return inventory;
}

module.exports = {
  createInventory,
  addItem,
  equipItem
};
