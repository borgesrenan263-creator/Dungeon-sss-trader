const {
  createInventory,
  addItem,
  equipItem
} = require("../src/domain/game/systems/inventory.system");

describe("Inventory System", () => {

  test("player should receive item", () => {
    const inv = createInventory();

    addItem(inv, { item:"Iron Sword", rarity:"uncommon" });

    expect(inv.items.length).toBe(1);
  });

  test("player should equip weapon", () => {
    const inv = createInventory();

    addItem(inv, { item:"Iron Sword", rarity:"uncommon" });

    equipItem(inv, "Iron Sword");

    expect(inv.equipped.weapon).toBeDefined();
  });

});
