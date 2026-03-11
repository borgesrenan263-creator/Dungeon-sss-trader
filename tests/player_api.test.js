const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("Player API", () => {
  test("should create player", async () => {
    const res = await request(app)
      .post("/player/create")
      .send({ name: "HeroAPI" });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.player.name).toBe("HeroAPI");
  });

  test("should get player profile", async () => {
    await request(app)
      .post("/player/create")
      .send({ name: "HeroGet" });

    const res = await request(app).get("/player/HeroGet");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.profile.player.name).toBe("HeroGet");
  });

  test("should move player sector", async () => {
    await request(app)
      .post("/player/create")
      .send({ name: "HeroMove" });

    const res = await request(app)
      .post("/player/HeroMove/move-sector")
      .send({ sector: 12 });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.moved.moved.sector).toBe(12);
  });
});
