const {
  calculateDamage,
  xpNeeded,
  applyLevelUp,
  getAttributeBonus,
  sellCrystal,
  forgeAttempt
} = require("../src/game/engine");

describe("Game Engine", () => {
  test("calculateDamage should never return less than 2", () => {
    expect(calculateDamage(5, 999)).toBe(2);
  });

  test("calculateDamage should scale with attacker and defender", () => {
    expect(calculateDamage(20, 10)).toBeGreaterThan(2);
    expect(calculateDamage(40, 10)).toBeGreaterThan(calculateDamage(20, 10));
  });

  test("xpNeeded should follow level * 25", () => {
    expect(xpNeeded(1)).toBe(25);
    expect(xpNeeded(10)).toBe(250);
  });

  test("applyLevelUp should raise level and grant points", () => {
    const player = {
      level: 1,
      xp: 30,
      unspentPoints: 0,
      baseStats: {
        maxHp: 140,
        atk: 12,
        def: 16,
        agi: 6
      }
    };

    const updated = applyLevelUp(player);

    expect(updated.level).toBe(2);
    expect(updated.unspentPoints).toBe(5);
    expect(updated.baseStats.maxHp).toBe(152);
    expect(updated.baseStats.atk).toBe(14);
    expect(updated.baseStats.def).toBe(17);
    expect(updated.baseStats.agi).toBe(7);
  });

  test("getAttributeBonus should convert attributes into stats", () => {
    const bonus = getAttributeBonus({
      str: 3,
      def: 2,
      agi: 4,
      vit: 5
    });

    expect(bonus.atk).toBe(6);
    expect(bonus.def).toBe(4);
    expect(bonus.agi).toBe(8);
    expect(bonus.hp).toBe(60);
  });

  test("sellCrystal should calculate crystal sale correctly", () => {
    const values = {
      F: 50,
      E: 200,
      D: 600,
      C: 1500,
      B: 4000,
      A: 8000,
      SS: 15000
    };

    const result = sellCrystal({ SS: 3 }, "SS", values);

    expect(result.goldEarned).toBe(45000);
    expect(result.newAmount).toBe(0);
  });

  test("forgeAttempt should return true when roll is below chance", () => {
    expect(forgeAttempt(90, 10)).toBe(true);
    expect(forgeAttempt(20, 50)).toBe(false);
  });
});
