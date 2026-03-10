const {
  createEquipmentPlayer,
  addItemToInventory,
  equipItem,
  refineItem
} = require("../src/engine/equipment_engine");
const { addDropToInventory, countMaterial } = require("../src/engine/inventory_engine");

describe("Refine System", () => {
  test("should fail if player has no materials", () => {
    const player = createEquipmentPlayer("Hero");
    player.gold = 1000;

    addItemToInventory(player, "iron_sword");
    equipItem(player, "iron_sword");

    const result = refineItem(player, "weapon");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("not_enough_refine_stone");
  });

  test("should consume resources when trying refine", () => {
    const player = createEquipmentPlayer("Hero");
    player.gold = 1000;

    addItemToInventory(player, "iron_sword");
    equipItem(player, "iron_sword");

    addDropToInventory(player.inventory, {
      type: "material",
      id: "refine_stone",
      name: "Refine Stone"
    });

    addDropToInventory(player.inventory, {
      type: "material",
      id: "mana_crystal_f",
      name: "Mana Crystal F"
    });

    const beforeGold = player.gold;
    const beforeStone = countMaterial(player.inventory, "refine_stone");
    const beforeCrystal = countMaterial(player.inventory, "mana_crystal_f");

    const result = refineItem(player, "weapon");

    expect(beforeGold).toBeGreaterThan(player.gold);
    expect(beforeStone).toBeGreaterThan(countMaterial(player.inventory, "refine_stone"));
    expect(beforeCrystal).toBeGreaterThan(countMaterial(player.inventory, "mana_crystal_f"));
    expect(result.ok === true || result.failed === true).toBe(true);
  });
});
