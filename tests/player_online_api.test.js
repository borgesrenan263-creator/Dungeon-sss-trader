const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("Player Online API", () => {
  test("should login player", async () => {
    const res = await request(app)
      .post("/player/login")
      .send({ name: "OnlineHero", nickname: "OnlineHero" });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.player.isOnline).toBe(true);
  });

  test("should list online players", async () => {
    await request(app)
      .post("/player/login")
      .send({ name: "OnlineListHero" });

    const res = await request(app).get("/player/online");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.online)).toBe(true);
  });

  test("should logout player", async () => {
    await request(app)
      .post("/player/login")
      .send({ name: "LogoutHero" });

    const res = await request(app)
      .post("/player/logout")
      .send({ name: "LogoutHero" });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.player.isOnline).toBe(false);
  });
});
