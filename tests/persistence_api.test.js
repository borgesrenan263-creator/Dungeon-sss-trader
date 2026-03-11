const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("Persistence API", () => {
  test("should init persistence", async () => {
    const res = await request(app).post("/persistence/init");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("should save and load persistence", async () => {
    await request(app).post("/persistence/init");

    await request(app)
      .post("/player/create")
      .send({ name: "SqlHero" });

    const saveRes = await request(app).post("/persistence/save");
    expect(saveRes.statusCode).toBe(200);
    expect(saveRes.body.ok).toBe(true);

    const loadRes = await request(app).get("/persistence/load");
    expect(loadRes.statusCode).toBe(200);
    expect(loadRes.body.ok).toBe(true);
    expect(loadRes.body.data).toBeDefined();
    expect(Array.isArray(loadRes.body.data.players)).toBe(true);
  });
});
