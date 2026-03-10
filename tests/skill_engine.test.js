const { createPlayer, createMob } = require("../src/engine/combat_engine");
const { useSkill } = require("../src/engine/skill_engine");

describe("Skill Engine", () => {
  test("skill should damage mob", () => {
    const hero = createPlayer("Hero", 100, 8);
    const slime = createMob("Slime", 30, 3);

    const result = useSkill(hero, slime);

    expect(result.damage).toBeGreaterThanOrEqual(12);
    expect(result.defenderHp).toBeLessThan(30);
  });
});
