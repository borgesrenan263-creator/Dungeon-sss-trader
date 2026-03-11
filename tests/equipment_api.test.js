const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");
const { addItemToInventory } = require("../src/engine/equipment_engine");
const { addDropToInventory } = require("../src/engine/inventory_engine");
const { getPlayerByName } = require("../src/api/state/game.state");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("Equipment API", () => {
  test("should equip item", async () => {
    await request(app).post("/player/create").send({ name: "EquipHero" });

    const player = getPlayerByName("EquipHero");
    addItemToInventory(player, "iron_sword");

    const res = await request(app)
      .post("/equipment/equip")
      .send({
        playerName: "EquipHero",
        itemId: "iron_sword"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("should get equipment state", async () => {
    await request(app).post("/player/create").send({ name: "EquipView" });

    const res = await request(app).get("/equipment/EquipView");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.equipment).toBeDefined();
  });

  test("should refine equipped item", async () => {
    await request(app).post("/player/create").send({ name: "RefineHero" });

    const player = getPlayerByName("RefineHero");
    player.gold = 1000;

    addItemToInventory(player, "iron_sword");

    addDropToInventory(player.inventory, {
      type: "material",
      id: "refine_stone",
      name: "Refine Stone"
    });

    addDropToInventory(player.inventory, {
      type: "material",
      id: "mana_crystal_f",
      name: "Mana Crystal F"
    });

    await request(app)
      .post("/equipment/equip")
      .send({
        playerName: "RefineHero",
        itemId: "iron_sword"
      });

    const res = await request(app)
      .post("/equipment/refine")
      .send({
        playerName: "RefineHero",
        slot: "weapon"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
