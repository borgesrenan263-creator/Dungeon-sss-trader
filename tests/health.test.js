const request = require("supertest");
const app = require("../src/app");

describe("GET /health", () => {
  it("should return server health", async () => {
    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.server).toBe("running");
  });
});
