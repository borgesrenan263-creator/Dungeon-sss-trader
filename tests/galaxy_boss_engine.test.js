const {
  createGalaxyBoss,
  joinGalaxyBoss,
  attackGalaxyBoss,
  finishGalaxyBoss
} = require("../src/engine/galaxy_boss_engine");

describe("Galaxy Boss Engine", () => {

  test("players should join event", () => {

    const boss = createGalaxyBoss();

    joinGalaxyBoss(boss, "Hero");
    joinGalaxyBoss(boss, "Player2");

    expect(boss.participants.length).toBe(2);

  });

  test("players should damage boss", () => {

    const boss = createGalaxyBoss();

    joinGalaxyBoss(boss, "Hero");

    const result = attackGalaxyBoss(boss, "Hero", 500);

    expect(result.ok).toBe(true);
    expect(boss.hp).toBeLessThan(boss.maxHp);

  });

  test("boss should die and give reward", () => {

    const boss = createGalaxyBoss();

    joinGalaxyBoss(boss, "Hero");
    joinGalaxyBoss(boss, "Player2");

    attackGalaxyBoss(boss, "Hero", 6000);

    const result = finishGalaxyBoss(boss);

    expect(result.ok).toBe(true);
    expect(result.reward.reward).toBe("Rune Galaxy");

  });

});
