const { rollMobBySector, createBossMob } = require("../src/engine/farm_engine");

describe("Sector Farm Engine", () => {
  test("should create sector mob", () => {
    const mob = rollMobBySector(1);

    expect(mob.name).toBeTruthy();
    expect(mob.hp).toBeGreaterThan(0);
    expect(mob.atk).toBeGreaterThan(0);
  });

  test("should create boss mob", () => {
    const boss = createBossMob(10);

    expect(boss.isBoss).toBe(true);
    expect(boss.hp).toBeGreaterThan(0);
  });
});
