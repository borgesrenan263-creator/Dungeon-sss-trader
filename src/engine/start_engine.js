const { startGameTick } = require("./game_tick");

function startEngine(){

  console.log("⚙️ Engine do jogo iniciada");

  startGameTick();

}

module.exports = { startEngine };
