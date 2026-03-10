const {
  createInventory,
  addDropToInventory,
  countMaterial,
  consumeMaterial
} = require("../src/engine/inventory_engine");

describe("Inventory Engine", () => {
  test("should add equipment to equipment bucket", () => {
    const inventory = createInventory();

    const result = addDropToInventory(inventory, {
      type: "equipment",
      id: "iron_sword",
      name: "Iron Sword"
    });

    expect(result.ok).toBe(true);
    expect(inventory.equipments.length).toBe(1);
  });

  test("should add and consume material", () => {
    const inventory = createInventory();

    addDropToInventory(inventory, {
      type: "material",
      id: "refine_stone",
      name: "Refine Stone"
    });

    expect(countMaterial(inventory, "refine_stone")).toBe(1);

    const consumed = consumeMaterial(inventory, "refine_stone", 1);

    expect(consumed).toBe(true);
    expect(countMaterial(inventory, "refine_stone")).toBe(0);
  });
});
