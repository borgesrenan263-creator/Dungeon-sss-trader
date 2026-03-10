const { simulateCombat } = require("../src/game/combat.simulator");

describe("Combat Simulation", () => {

  test("player should defeat weak mob", () => {

    const player = {
      hp: 120,
      baseStats: {
        atk: 15,
        def: 10
      }
    };

    const mob = {
      hp: 40,
      atk: 6,
      def: 2
    };

    const result = simulateCombat(player, mob);

    expect(result.winner).toBe("player");
    expect(result.rounds).toBeGreaterThan(0);
    expect(result.log.length).toBeGreaterThan(0);

  });

  test("combat should produce battle log", () => {

    const player = {
      hp: 120,
      baseStats: {
        atk: 15,
        def: 10
      }
    };

    const mob = {
      hp: 50,
      atk: 8,
      def: 3
    };

    const result = simulateCombat(player, mob);

    expect(Array.isArray(result.log)).toBe(true);

  });

});
