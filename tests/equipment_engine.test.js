const {
  createEquipmentPlayer,
  addItemToInventory,
  equipItem,
  refineItem,
  getFinalStats,
  getRefineRequirements
} = require("../src/engine/equipment_engine");
const { addDropToInventory } = require("../src/engine/inventory_engine");

describe("Equipment Engine", () => {
  test("player should add and equip weapon", () => {
    const player = createEquipmentPlayer("Hero");

    addItemToInventory(player, "iron_sword");
    const equip = equipItem(player, "iron_sword");

    expect(equip.ok).toBe(true);
    expect(player.equipped.weapon.name).toBe("Iron Sword");
  });

  test("equipped item should increase stats", () => {
    const player = createEquipmentPlayer("Hero");

    addItemToInventory(player, "iron_sword");
    equipItem(player, "iron_sword");

    const stats = getFinalStats(player);

    expect(stats.attributes.str).toBeGreaterThan(10);
    expect(stats.derived.atk).toBeGreaterThan(25);
  });

  test("should expose refine requirements", () => {
    const req = getRefineRequirements(0);

    expect(req.gold).toBe(50);
    expect(req.stone).toBe(1);
    expect(req.crystalId).toBe("mana_crystal_f");
  });

  test("refine should consume materials and gold on success path", () => {
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

    let tries = 0;
    let success = false;

    while (tries < 10 && !success) {
      const snapshotGold = player.gold;

      const result = refineItem(player, "weapon");

      if (result.ok) {
        success = true;
        expect(player.equipped.weapon.refine).toBeGreaterThanOrEqual(1);
        expect(player.gold).toBeLessThan(snapshotGold);
      } else if (!result.failed) {
        break;
      }

      tries++;
    }

    expect(player.equipped.weapon.refine).toBeGreaterThanOrEqual(1);
  });
});
