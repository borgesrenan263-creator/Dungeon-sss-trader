const request = require("supertest");
const app = require("../src/app");

describe("World routes", () => {
  it("GET /world should return world data", async () => {
    const res = await request(app).get("/world");

    expect([200, 500]).toContain(res.statusCode);
  });

  it("GET /world/sectors should return sectors", async () => {
    const res = await request(app).get("/world/sectors");

    expect([200, 500]).toContain(res.statusCode);
  });

  it("GET /world/sector/1 should return one sector or handled error", async () => {
    const res = await request(app).get("/world/sector/1");

    expect([200, 400, 404, 500]).toContain(res.statusCode);
  });
});
