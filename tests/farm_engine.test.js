const { rollMobByStage } = require("../src/engine/farm_engine");

describe("Farm Engine", () => {
  test("should create stronger mobs on higher stages", () => {
    const mob1 = rollMobByStage(1);
    const mob5 = rollMobByStage(5);

    expect(mob5.hp).toBeGreaterThanOrEqual(mob1.hp);
    expect(mob5.atk).toBeGreaterThanOrEqual(mob1.atk);
  });
});
