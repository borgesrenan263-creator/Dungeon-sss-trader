const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("Realtime API", () => {
  test("should return realtime info", async () => {
    const res = await request(app).get("/realtime");

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.realtime).toBeDefined();
    expect(res.body.realtime).toHaveProperty("enabled");
    expect(res.body.realtime).toHaveProperty("clients");
    expect(res.body.realtime).toHaveProperty("path");
  });
});
