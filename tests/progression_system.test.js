const {
  createPlayer,
  gainXp,
  calculateRank
} = require("../src/domain/game/systems/progression.system");

describe("Player Progression", () => {
  test("player should gain xp and level up", () => {
    const player = createPlayer("Hero");

    gainXp(player, 50);

    expect(player.level).toBeGreaterThan(1);
  });

  test("ranking should sort players by rankPoints", () => {
    const p1 = createPlayer("A");
    const p2 = createPlayer("B");

    p1.rankPoints = 30;
    p2.rankPoints = 10;

    const ranked = calculateRank([p1,p2]);

    expect(ranked[0].name).toBe("A");
  });
});
