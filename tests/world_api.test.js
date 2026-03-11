const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("World API", () => {
  test("should return world state", async () => {
    const res = await request(app).get("/world");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.world).toBeDefined();
  });

  test("should return sectors", async () => {
    const res = await request(app).get("/world/sectors");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.sectors)).toBe(true);
  });

  test("should return one sector", async () => {
    const res = await request(app).get("/world/sector/1");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.sector).toBeDefined();
    expect(res.body.sector.id).toBe(1);
  });

  test("should advance world tick", async () => {
    const res = await request(app).post("/world/tick");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.result).toBeDefined();
    expect(res.body.result.spawn).toBeDefined();
  });
});
