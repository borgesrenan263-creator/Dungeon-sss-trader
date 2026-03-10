const request = require("supertest");
const app = require("../src/app");

describe("Galaxy Isekai Protocol - Smoke Tests", () => {
  test("GET /health deve responder 200", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
  });

  test("GET /world deve responder 200 e conter setores", async () => {
    const res = await request(app).get("/world");
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.world).toBeDefined();
    expect(Array.isArray(res.body.world.world_sectors)).toBe(true);
    expect(res.body.world.world_sectors.length).toBeGreaterThan(0);
  });

  test("POST /player/create deve criar personagem", async () => {
    const payload = {
      nickname: "TesteJest",
      playerClass: "Cavaleiro"
    };

    const res = await request(app)
      .post("/player/create")
      .send(payload)
      .set("Content-Type", "application/json");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.player).toBeDefined();
    expect(res.body.player.nickname).toBe("TesteJest");
  });
});
