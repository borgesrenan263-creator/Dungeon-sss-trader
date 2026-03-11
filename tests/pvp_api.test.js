const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("PVP API", () => {
  test("should attack another player", async () => {
    await request(app).post("/player/create").send({ name: "PvPHeroA" });
    await request(app).post("/player/create").send({ name: "PvPHeroB" });

    const res = await request(app)
      .post("/pvp/attack")
      .send({
        attackerName: "PvPHeroA",
        defenderName: "PvPHeroB"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.damage).toBeGreaterThan(0);
  });

  test("should get pvp status", async () => {
    await request(app).post("/player/create").send({ name: "PvPStatusHero" });

    const res = await request(app).get("/pvp/status/PvPStatusHero");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.pvp.name).toBe("PvPStatusHero");
  });

  test("should defeat defender after repeated attacks", async () => {
    await request(app).post("/player/create").send({ name: "PvPKiller" });
    await request(app).post("/player/create").send({ name: "PvPVictim" });

    let finalRes;

    for (let i = 0; i < 20; i++) {
      finalRes = await request(app)
        .post("/pvp/attack")
        .send({
          attackerName: "PvPKiller",
          defenderName: "PvPVictim"
        });

      if (finalRes.body.defeated) break;
    }

    expect(finalRes.statusCode).toBe(200);
    expect(finalRes.body.ok).toBe(true);
    expect(finalRes.body.defeated).toBe(true);
    expect(finalRes.body.winner).toBe("PvPKiller");
  });
});
