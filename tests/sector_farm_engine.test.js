const { rollMobBySector, createBossMob } = require("../src/engine/sector_farm_engine");

describe("Sector Farm Engine", () => {
  test("should create stronger mobs on higher sectors", () => {
    const mob1 = rollMobBySector(1);
    const mob5 = rollMobBySector(5);

    expect(mob5.hp).toBeGreaterThanOrEqual(mob1.hp);
    expect(mob5.atk).toBeGreaterThanOrEqual(mob1.atk);
  });

  test("should create boss mob", () => {
    const boss = createBossMob(10);

    expect(boss.isBoss).toBe(true);
    expect(boss.hp).toBeGreaterThan(0);
    expect(boss.atk).toBeGreaterThan(0);
  });
});
