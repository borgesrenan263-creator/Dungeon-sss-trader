const { EQUIPMENT_DB } = require("../src/engine/equipment_db");

describe("Equipment DB", () => {
  test("should contain iron sword", () => {
    expect(EQUIPMENT_DB.iron_sword.name).toBe("Iron Sword");
    expect(EQUIPMENT_DB.iron_sword.slot).toBe("weapon");
  });
});
