const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("Multiplayer API", () => {

  test("player should join", async () => {

    const res = await request(app)
      .post("/multiplayer/join")
      .send({ name: "HeroOnline" });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

  });

});
