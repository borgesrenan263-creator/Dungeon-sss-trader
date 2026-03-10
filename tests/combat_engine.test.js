const {
  createMob,
  createPlayer,
  attack
} = require("../src/engine/combat_engine");

describe("Combat Engine", () => {
  test("player should damage mob", () => {
    const player = createPlayer("Hero", 100, 10);
    const mob = createMob("Slime", 30, 3);

    const result = attack(player, mob);

    expect(result.damage).toBe(10);
    expect(result.defenderHp).toBe(20);
    expect(result.defeated).toBe(false);
  });

  test("player should defeat mob", () => {
    const player = createPlayer("Hero", 100, 50);
    const mob = createMob("Wolf", 20, 5);

    const result = attack(player, mob);

    expect(result.defenderHp).toBe(0);
    expect(result.defeated).toBe(true);
  });
});
