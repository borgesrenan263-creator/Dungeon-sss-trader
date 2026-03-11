const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("World and Galaxy API", () => {
  test("should return world state", async () => {
    const res = await request(app).get("/world/state");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.world).toBeTruthy();
  });

  test("should join galaxy boss", async () => {
    await request(app)
      .post("/player/create")
      .send({ name: "GalaxyHero" });

    const res = await request(app)
      .post("/galaxy/join")
      .send({ name: "GalaxyHero" });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("should attack galaxy boss", async () => {
    await request(app)
      .post("/player/create")
      .send({ name: "GalaxyAtk" });

    await request(app)
      .post("/galaxy/join")
      .send({ name: "GalaxyAtk" });

    const res = await request(app)
      .post("/galaxy/attack")
      .send({ name: "GalaxyAtk", damage: 300 });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
