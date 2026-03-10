const { createPlayer, createMob, attack } = require("../src/engine/combat_engine");

describe("Auto Combat System", () => {
  test("mob should be defeated after repeated attacks", () => {
    const player = createPlayer("Hero", 100, 10);
    const mob = createMob("Slime", 25, 3);

    let result;

    while (mob.hp > 0) {
      result = attack(player, mob);
    }

    expect(result.defeated).toBe(true);
    expect(mob.hp).toBe(0);
  });
});
