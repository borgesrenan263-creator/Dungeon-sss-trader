const request = require("supertest");
const express = require("express");
const routes = require("../src/api/routes");

const app = express();
app.use(express.json());
app.use("/", routes);

describe("Dashboard API", () => {
  test("should render dashboard page", async () => {
    const res = await request(app).get("/dashboard");

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Dungeon SSS Trader Dashboard");
    expect(res.text).toContain("World");
    expect(res.text).toContain("Market");
  });
});
