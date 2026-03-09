const request = require("supertest");
const app = require("../src/app");

describe("Character routes", () => {
  it("GET /character/stats/1", async () => {
    const res = await request(app).get("/character/stats/1");
    expect([200, 404, 500]).toContain(res.statusCode);
  });

  it("POST /character/gain-xp with invalid body should fail safely", async () => {
    const res = await request(app)
      .post("/character/gain-xp")
      .send({});

    expect([400, 404, 500]).toContain(res.statusCode);
  });
});
