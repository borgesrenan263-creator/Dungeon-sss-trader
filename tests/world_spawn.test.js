const { spawnMob } = require("../src/domain/game/engine/world.spawn");

describe("World Spawn", () => {
  test("should spawn mob scaled to player level", () => {
    const mob = spawnMob(5);

    expect(mob.hp).toBeGreaterThan(0);
    expect(mob.atk).toBeGreaterThan(0);
    expect(mob.xp).toBeGreaterThan(0);
    expect(mob.gold).toBeGreaterThan(0);
  });
});
