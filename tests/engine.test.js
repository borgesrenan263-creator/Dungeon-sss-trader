const {
  calculateDamage,
  xpNeeded,
  applyLevelUp,
  getAttributeBonus,
  sellCrystal,
  forgeAttempt,
  rewardVictory,
  simulateBattleRound
} = require("../src/domain/game/engine/core.engine");

describe("Game Engine", () => {

  test("calculateDamage should never return less than 2", () => {
    expect(calculateDamage(5,999)).toBe(2);
  });

  test("xpNeeded should follow level * 25", () => {
    expect(xpNeeded(1)).toBe(25);
  });

});
