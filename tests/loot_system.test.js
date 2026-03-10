const { rollLoot } = require("../src/game/loot.system");

describe("Loot System", () => {

  test("loot should return an item with rarity", () => {

    const loot = rollLoot();

    expect(loot.item).toBeDefined();
    expect(loot.rarity).toBeDefined();

  });

});
