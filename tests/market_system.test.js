const {
  createMarket,
  listItem,
  buyItem
} = require("../src/game/market.system");

describe("Market System", () => {

  test("player should list item in market", () => {

    const market = createMarket();

    listItem(market, "Hero1", { item:"Iron Sword" }, 50);

    expect(market.listings.length).toBe(1);

  });

  test("player should buy item from market", () => {

    const market = createMarket();

    listItem(market, "Hero1", { item:"Iron Sword" }, 50);

    const item = buyItem(market, 100, 0);

    expect(item.item).toBe("Iron Sword");
    expect(market.listings.length).toBe(0);

  });

});
