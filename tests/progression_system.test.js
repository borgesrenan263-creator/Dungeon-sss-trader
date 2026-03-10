const {
  createProgressionPlayer,
  applyRewards
} = require("../src/engine/progression_system");

describe("Progression System", () => {
  test("player should gain xp, gold and drop", () => {
    const player = createProgressionPlayer("Hero");

    applyRewards(player, {
      xp: 20,
      gold: 15,
      drop: "Cristal F"
    });

    expect(player.xp).toBe(20);
    expect(player.gold).toBe(15);
    expect(player.inventory.includes("Cristal F")).toBe(true);
  });

  test("player should level up", () => {
    const player = createProgressionPlayer("Hero");

    applyRewards(player, {
      xp: 120,
      gold: 10,
      drop: "Cristal F"
    });

    expect(player.level).toBe(2);
    expect(player.xp).toBe(20);
  });
});
