const express = require("express");
const http = require("http");

const routes = require("./api/routes");
const { startWorldLoop, getWorldState } = require("./engine/world_loop_engine");
const { attachRealtime, broadcast } = require("./realtime/live_hub");
const { getApiWorldState } = require("./api/state/game.state");
const { getTelemetry } = require("./engine/telemetry_engine");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log("Dungeon SSS Trader API running on port", PORT);

  attachRealtime(server);

  if (process.env.NODE_ENV !== "test") {
    console.log("🌍 Starting world engine...");

    startWorldLoop(getWorldState(), {
      onTick: () => {
        broadcast("world:update", {
          world: getApiWorldState(),
          telemetry: getTelemetry(getWorldState())
        });
      },
      onMobSpawn: (payload) => {
        broadcast("world:mob_spawn", payload);
      },
      onEvent: (payload) => {
        broadcast("world:event", payload);
      },
      onEconomyTick: (payload) => {
        broadcast("economy:update", payload);
      },
      onBossSpawn: (payload) => {
        broadcast("boss:spawn", payload);
      }
    });
  }
});
