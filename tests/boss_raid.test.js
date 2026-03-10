const { simulateBossRaid } = require("../src/domain/game/engine/boss.raid");

describe("Boss Raid", () => {
  test("raid should produce ranking and loot winner", () => {
    const players = [
      { id:1, nickname:"Hero1", baseStats:{ atk:15 } },
      { id:2, nickname:"Hero2", baseStats:{ atk:12 } },
      { id:3, nickname:"Hero3", baseStats:{ atk:10 } }
    ];

    const boss = {
      name:"Galaxy Dragon",
      hp:200
    };

    const result = simulateBossRaid(players, boss);

    expect(result.ranking.length).toBe(players.length);
    expect(result.totalDamage).toBeGreaterThan(0);
    expect(result.lootWinner).toBeDefined();
  });
});
