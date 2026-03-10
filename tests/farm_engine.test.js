const { rollMobBySector } = require("../src/engine/farm_engine");

describe("Farm Engine", () => {

  test("should create stronger mobs on higher sectors", () => {

    const mob1 = rollMobBySector(1);
    const mob5 = rollMobBySector(5);

    expect(mob5.hp).toBeGreaterThanOrEqual(mob1.hp);
    expect(mob5.atk).toBeGreaterThanOrEqual(mob1.atk);

  });

});
