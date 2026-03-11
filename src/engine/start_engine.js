const { startGameTick } = require("./game_tick");
const { startFarmEngine } = require("./farm_engine");
const { startWorldLoopEngine } = require("./world_loop_engine");

function startEngine() {
  console.log("⚙️ Engine do jogo iniciada");

  startGameTick();
  startFarmEngine();
  startWorldLoopEngine();
}

module.exports = { startEngine };
