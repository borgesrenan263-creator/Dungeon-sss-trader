const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");
const { addItemToInventory } = require("../src/engine/equipment_engine");
const { addDropToInventory } = require("../src/engine/inventory_engine");
const { getPlayerByName, registerDropForPlayer } = require("../src/api/state/game.state");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("Inventory Visual API", () => {
  test("should return inventory view", async () => {
    await request(app).post("/player/create").send({ name: "InvHero" });

    const player = getPlayerByName("InvHero");
    addItemToInventory(player, "iron_sword");
    addDropToInventory(player.inventory, {
      type: "material",
      id: "refine_stone",
      name: "Refine Stone"
    });

    const res = await request(app).get("/inventory/InvHero");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.inventory.owner).toBe("InvHero");
  });

  test("should return player drops", async () => {
    await request(app).post("/player/create").send({ name: "DropHero" });

    registerDropForPlayer("DropHero", {
      type: "material",
      id: "mana_crystal_f",
      name: "Mana Crystal F"
    });

    const res = await request(app).get("/inventory/DropHero/drops");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.drops)).toBe(true);
    expect(res.body.drops.length).toBeGreaterThan(0);
  });

  test("should return player status", async () => {
    await request(app).post("/player/create").send({ name: "StatusVisualHero" });

    const res = await request(app).get("/player/StatusVisualHero/status");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.status.name).toBe("StatusVisualHero");
  });
});
