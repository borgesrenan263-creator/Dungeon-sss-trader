const {
  getWorldState,
  spawnWorldMob,
  triggerGlobalEvent,
  maybeSpawnGalaxyBoss,
  processEconomyTick
} = require("../src/engine/world_loop_engine");

describe("World Loop Engine", () => {
  test("should spawn a world mob", () => {
    const before = getWorldState().mobsSpawned;
    const mob = spawnWorldMob();
    const after = getWorldState().mobsSpawned;

    expect(mob).toBeTruthy();
    expect(after).toBe(before + 1);
  });

  test("should trigger global event", () => {
    const event = triggerGlobalEvent();

    expect(event).toBeTruthy();
  });

  test("should spawn galaxy boss on tick 30 multiple", () => {
    const state = getWorldState();
    state.ticks = 30;

    const boss = maybeSpawnGalaxyBoss();

    expect(boss).toBeTruthy();
    expect(boss.name).toBe("Galaxy Sovereign");
  });

  test("should process economy tick", () => {
    const trade = processEconomyTick();

    expect(trade.itemId).toBeTruthy();
    expect(trade.price).toBeGreaterThan(0);
  });
});
