const {
  createEconomy,
  recalculatePrice,
  npcBuy,
  npcSell,
  runEconomyTick
} = require("../src/engine/ai_economy_engine");

describe("AI Economy Engine", () => {
  test("should create economy state", () => {
    const economy = createEconomy();

    expect(economy.prices.iron_sword).toBe(500);
    expect(economy.tick).toBe(0);
  });

  test("npc buy should increase demand", () => {
    const economy = createEconomy();

    const before = economy.demand.iron_sword;
    npcBuy(economy, "iron_sword");

    expect(economy.demand.iron_sword).toBe(before + 1);
  });

  test("npc sell should increase supply", () => {
    const economy = createEconomy();

    const before = economy.supply.leather_armor;
    npcSell(economy, "leather_armor");

    expect(economy.supply.leather_armor).toBe(before + 1);
  });

  test("recalculate should return a valid price", () => {
    const economy = createEconomy();

    const price = recalculatePrice(economy, "refine_stone");

    expect(price).toBeGreaterThan(0);
  });

  test("economy tick should register trade", () => {
    const economy = createEconomy();

    const trade = runEconomyTick(economy);

    expect(trade.itemId).toBeTruthy();
    expect(economy.tick).toBe(1);
    expect(economy.npcTrades.length).toBe(1);
  });
});
