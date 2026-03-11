const express = require("express");
const http = require("http");

const routes = require("./api/routes");

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "Dungeon SSS Trader API",
    status: "running"
  });
});

app.use("/", routes);

const PORT = process.env.PORT || 8787;

server.listen(PORT, () => {
  console.log(`Dungeon SSS Trader running on port: ${PORT}`);
});

module.exports = { app, server };
