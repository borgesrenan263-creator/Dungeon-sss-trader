const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");
const { addItemToInventory } = require("../src/engine/equipment_engine");
const { getPlayerByName } = require("../src/api/state/game.state");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("Market API", () => {
  test("should list market state", async () => {
    const res = await request(app).get("/market");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.market).toBeDefined();
  });

  test("should list and buy item", async () => {
    await request(app).post("/player/create").send({ name: "SellerAPI" });
    await request(app).post("/player/create").send({ name: "BuyerAPI" });

    const seller = getPlayerByName("SellerAPI");
    addItemToInventory(seller, "iron_sword");

    const listed = await request(app)
      .post("/market/list")
      .send({
        playerName: "SellerAPI",
        itemId: "iron_sword",
        price: 500
      });

    expect(listed.statusCode).toBe(200);
    expect(listed.body.ok).toBe(true);

    const listingId = listed.body.listing.id;

    const bought = await request(app)
      .post("/market/buy")
      .send({
        buyerName: "BuyerAPI",
        listingId
      });

    expect(bought.statusCode).toBe(200);
    expect(bought.body.ok).toBe(true);
  });
});
