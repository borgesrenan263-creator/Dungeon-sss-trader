const { createProgressionPlayer, applyRewards } = require("../src/engine/progression_system");
const { addDropToInventory } = require("../src/engine/inventory_engine");

describe("Progression System", () => {

  test("player should gain xp, gold and drop", () => {

    const player = createProgressionPlayer("Hero");

    applyRewards(player, {
      xp: 20,
      gold: 15
    });

    addDropToInventory(player.inventory, {
      type: "material",
      id: "mana_crystal_f",
      name: "Cristal F"
    });

    expect(player.xp).toBe(20);
    expect(player.gold).toBe(15);
    expect(player.inventory.materials.length).toBe(1);

  });

  test("player should level up", () => {

    const player = createProgressionPlayer("Hero");

    applyRewards(player, {
      xp: 150,
      gold: 0
    });

    expect(player.level).toBeGreaterThan(1);

  });

});
