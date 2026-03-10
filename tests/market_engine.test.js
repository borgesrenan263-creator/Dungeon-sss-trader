const {
  createMarket,
  listInventoryEquipment,
  getMarketListings,
  buyItem,
  cancelListing
} = require("../src/engine/market_engine");
const {
  createEquipmentPlayer,
  addItemToInventory
} = require("../src/engine/equipment_engine");

describe("Market Engine", () => {
  test("should list item from inventory", () => {
    const market = createMarket();
    const seller = createEquipmentPlayer("Seller");

    addItemToInventory(seller, "iron_sword");

    const result = listInventoryEquipment(market, seller, "iron_sword", 500);

    expect(result.ok).toBe(true);
    expect(getMarketListings(market).length).toBe(1);
    expect(seller.inventory.equipments.length).toBe(0);
  });

  test("should buy listed item and collect tax", () => {
    const market = createMarket();
    const seller = createEquipmentPlayer("Seller");
    const buyer = createEquipmentPlayer("Buyer");

    seller.gold = 0;
    buyer.gold = 1000;

    addItemToInventory(seller, "iron_sword");

    const listed = listInventoryEquipment(market, seller, "iron_sword", 500);

    const bought = buyItem(market, buyer, seller, listed.listing.id);

    expect(bought.ok).toBe(true);
    expect(buyer.inventory.equipments.length).toBe(1);
    expect(buyer.gold).toBe(500);
    expect(seller.gold).toBe(450);
    expect(market.treasury).toBe(50);
  });

  test("should cancel own listing", () => {
    const market = createMarket();
    const seller = createEquipmentPlayer("Seller");

    addItemToInventory(seller, "iron_sword");

    const listed = listInventoryEquipment(market, seller, "iron_sword", 500);
    const canceled = cancelListing(market, seller, listed.listing.id);

    expect(canceled.ok).toBe(true);
    expect(market.listings.length).toBe(0);
    expect(seller.inventory.equipments.length).toBe(1);
  });
});
