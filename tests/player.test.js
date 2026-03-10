const request = require("supertest");
const app = require("../src/app");

describe("Player Routes", () => {

  test("POST /player/create should create a player", async () => {

    const payload = {
      nickname: "TesteJest",
      class: "Cavaleiro"
    };

    const res = await request(app)
      .post("/player/create")
      .send(payload)
      .set("Content-Type", "application/json");

    expect(res.statusCode).toBe(200);

    expect(res.body).toBeDefined();
    expect(res.body.ok).toBe(true);

    expect(res.body.player).toBeDefined();
    expect(res.body.player.nickname).toBe("TesteJest");

  });

});
