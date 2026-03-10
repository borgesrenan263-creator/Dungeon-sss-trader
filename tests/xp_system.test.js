const { grantXp } = require("../src/domain/game/engine/xp.engine");

describe("XP System", () => {

  test("player should gain xp", () => {

    const player = {
      level:1,
      xp:0
    };

    const result = grantXp(player,50);

    expect(result.level).toBe(1);
    expect(result.xp).toBe(50);

  });

  test("player should level up", () => {

    const player = {
      level:1,
      xp:90
    };

    const result = grantXp(player,20);

    expect(result.levelUp).toBe(true);
    expect(result.level).toBe(2);

  });

});
