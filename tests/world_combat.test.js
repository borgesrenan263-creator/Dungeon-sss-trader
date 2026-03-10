const { addMob, getWorldState } = require("../src/domain/world/world.state");
const { attackMobByIndex } = require("../src/domain/world/combat.world");

describe("World Combat", () => {

  test("should attack active mob from world state", () => {

    const world = getWorldState();
    world.activeMobs.length = 0;

    addMob({
      name: "Goblin",
      zone: 1,
      hp: 20
    });

    const player = {
      atk: 7,
      level:1,
      xp:0
    };

    const result = attackMobByIndex(player, 0);

    expect(result.ok).toBe(true);
    expect(result.mob).toBe("Goblin");

  });

  test("should remove mob when defeated", () => {

    const world = getWorldState();
    world.activeMobs.length = 0;

    addMob({
      name: "Slime",
      zone: 1,
      hp: 5
    });

    const player = {
      atk: 10,
      level:1,
      xp:0
    };

    const result = attackMobByIndex(player, 0);

    expect(result.ok).toBe(true);
    expect(result.defeated).toBe(true);
    expect(getWorldState().activeMobs.length).toBe(0);

  });

});
