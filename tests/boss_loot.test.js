const { rollBossReward } = require("../src/domain/game/engine/boss/boss.loot");

describe("Boss Loot", () => {

  test("should select one winner", () => {

    const players = [1,2,3,4];

    const result = rollBossReward(players);

    expect(result.ok).toBe(true);
    expect(players.includes(result.winner)).toBe(true);

  });

});
