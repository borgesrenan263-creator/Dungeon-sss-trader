const express = require("express");
const routes = require("./api/routes");
const { startWorldLoop, getWorldState } = require("./engine/world_loop_engine");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

app.listen(PORT, () => {
  console.log("Dungeon SSS Trader API running on port", PORT);

  if (process.env.NODE_ENV !== "test") {
    console.log("🌍 Starting world engine...");
    startWorldLoop(getWorldState());
  }
});
