const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("Pack 5 API", () => {
  test("should return leaderboard", async () => {
    await request(app).post("/player/create").send({ name: "Pack5GoldA" });
    await request(app).post("/player/create").send({ name: "Pack5GoldB" });

    const res = await request(app).get("/leaderboard");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.leaderboard).toBeDefined();
    expect(Array.isArray(res.body.leaderboard.gold)).toBe(true);
    expect(Array.isArray(res.body.leaderboard.pvp)).toBe(true);
  });

  test("should return world analytics", async () => {
    const res = await request(app).get("/analytics/world");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.analytics).toBeDefined();
    expect(res.body.analytics).toHaveProperty("ticks");
    expect(res.body.analytics).toHaveProperty("spawnRate");
  });

  test("should return telemetry", async () => {
    const res = await request(app).get("/telemetry");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.telemetry).toBeDefined();
    expect(res.body.telemetry).toHaveProperty("uptimeSeconds");
    expect(res.body.telemetry).toHaveProperty("ticksPerSecond");
  });
});
