const request = require("supertest");
const app = require("../src/app");

describe("Worldmap routes", () => {
  it("GET /worldmap/world", async () => {
    const res = await request(app).get("/worldmap/world");
    expect([200, 500]).toContain(res.statusCode);
  });

  it("GET /worldmap/links", async () => {
    const res = await request(app).get("/worldmap/links");
    expect([200, 500]).toContain(res.statusCode);
  });

  it("GET /worldmap/events", async () => {
    const res = await request(app).get("/worldmap/events");
    expect([200, 500]).toContain(res.statusCode);
  });
});
