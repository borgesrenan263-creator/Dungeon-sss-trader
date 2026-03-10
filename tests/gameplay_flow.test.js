const {
  createGameplayPlayer,
  gainXp,
  allocateStats
} = require("../src/game/gameplay.service");

describe("Gameplay Flow", () => {
  test("player should be created with base stats", () => {
    const player = createGameplayPlayer();

    expect(player.nickname).toBe("TestHero");
    expect(player.level).toBe(1);
    expect(player.gold).toBe(100);
    expect(player.baseStats.atk).toBe(12);
  });

  test("player should gain xp and level up", () => {
    const player = createGameplayPlayer();

    gainXp(player, 30);

    expect(player.level).toBe(2);
    expect(player.unspentPoints).toBe(5);
    expect(player.baseStats.atk).toBe(14);
    expect(player.baseStats.def).toBe(17);
    expect(player.baseStats.agi).toBe(7);
  });

  test("player should allocate attribute points", () => {
    const player = createGameplayPlayer();

    gainXp(player, 30);

    const updated = allocateStats(player, {
      str: 2,
      def: 1,
      agi: 1,
      vit: 1
    });

    expect(updated.unspentPoints).toBe(0);
    expect(updated.attributes.str).toBe(2);
    expect(updated.attributes.def).toBe(1);
    expect(updated.attributes.agi).toBe(1);
    expect(updated.attributes.vit).toBe(1);

    expect(updated.finalStats.atk).toBeGreaterThan(updated.baseStats.atk);
    expect(updated.finalStats.def).toBeGreaterThan(updated.baseStats.def);
    expect(updated.finalStats.agi).toBeGreaterThan(updated.baseStats.agi);
    expect(updated.finalStats.maxHp).toBeGreaterThan(updated.baseStats.maxHp);
  });

  test("should fail if trying to allocate more points than available", () => {
    const player = createGameplayPlayer();

    expect(() =>
      allocateStats(player, {
        str: 10
      })
    ).toThrow("not_enough_points");
  });
});
