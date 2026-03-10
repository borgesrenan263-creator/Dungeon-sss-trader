const { getMobReward } = require("../src/engine/reward_system");

describe("Reward System", () => {
  test("should return reward for slime", () => {
    const reward = getMobReward("Slime");

    expect(reward.xp).toBe(20);
    expect(reward.gold).toBe(10);
    expect(reward.drop).toBe("Cristal F");
  });
});
