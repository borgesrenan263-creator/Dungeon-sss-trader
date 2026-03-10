const { startGameTick } = require("./game_tick");
const { startFarmEngine } = require("./farm_engine");

function startEngine() {
  console.log("⚙️ Engine do jogo iniciada");

  startGameTick();
  startFarmEngine();
}

module.exports = { startEngine };
