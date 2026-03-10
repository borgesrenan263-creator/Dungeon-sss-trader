const { spawnMob } = require("../src/domain/game/engine/world.spawn");

describe("World Spawn", () => {
  test("should spawn mob for a valid zone", () => {
    const mob = spawnMob(5);

    expect(mob).toBeDefined();
    expect(mob.name).toBeDefined();
    expect(typeof mob.name).toBe("string");
    expect(mob.zone).toBe(5);
  });

  test("should fallback to zone 1 when zone does not exist", () => {
    const mob = spawnMob(999);

    expect(mob).toBeDefined();
    expect(mob.name).toBeDefined();
    expect(mob.zone).toBe(1);
  });
});
