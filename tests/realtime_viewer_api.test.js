const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("Realtime Viewer API", () => {
  test("should render realtime viewer page", async () => {
    const res = await request(app).get("/realtime/viewer");

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Dungeon SSS Trader Realtime");
    expect(res.text).toContain("WebSocket");
  });

  test("should send manual broadcast test", async () => {
    const res = await request(app).post("/realtime/broadcast-test");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.sent).toBeDefined();
  });
});
