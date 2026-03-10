const {
  simulateBattleRound,
  rewardVictory
} = require("../src/game/engine");

describe("Combat Flow Engine", () => {
  test("player should damage monster and survive a round", () => {
    const player = {
      hp: 120,
      atk: 20,
      def: 10
    };

    const monster = {
      hp: 50,
      atk: 8,
      def: 4,
      level: 3
    };

    const result = simulateBattleRound(player, monster);

    expect(result.playerDamage).toBeGreaterThan(0);
    expect(result.monster.hp).toBeLessThan(50);
    expect(result.player.hp).toBeGreaterThan(0);
    expect(result.playerDefeated).toBe(false);
  });

  test("player should defeat a weak monster", () => {
    const player = {
      hp: 120,
      atk: 40,
      def: 10
    };

    const monster = {
      hp: 10,
      atk: 5,
      def: 1,
      level: 2
    };

    const result = simulateBattleRound(player, monster);

    expect(result.monsterDefeated).toBe(true);
    expect(result.monster.hp).toBe(0);
  });

  test("victory should grant gold xp and crystal", () => {
    const player = {
      level: 1,
      xp: 0,
      gold: 100,
      unspentPoints: 0,
      baseStats: {
        maxHp: 140,
        atk: 12,
        def: 16,
        agi: 6
      },
      crystals: {
        F: 0,
        E: 0,
        D: 0,
        C: 0,
        B: 0,
        A: 0,
        SS: 0
      }
    };

    const monster = {
      level: 4
    };

    const result = rewardVictory(player, monster, "D");

    expect(result.rewards.xpGain).toBeGreaterThan(0);
    expect(result.rewards.goldGain).toBeGreaterThan(0);
    expect(result.player.gold).toBeGreaterThan(100);
    expect(result.player.crystals.D).toBe(1);
  });

  test("victory should level up player when xp threshold is reached", () => {
    const player = {
      level: 1,
      xp: 24,
      gold: 100,
      unspentPoints: 0,
      baseStats: {
        maxHp: 140,
        atk: 12,
        def: 16,
        agi: 6
      },
      crystals: {
        F: 0,
        E: 0,
        D: 0,
        C: 0,
        B: 0,
        A: 0,
        SS: 0
      }
    };

    const monster = {
      level: 4
    };

    const result = rewardVictory(player, monster, "F");

    expect(result.player.level).toBeGreaterThan(1);
    expect(result.player.unspentPoints).toBe(5);
  });
});
