const { spawnMob } = require("./spawn_system");

let tick = 0;

function startGameTick(){

  setInterval(() => {

    tick++;

    if(tick % 5 === 0){
      console.log("⚔️ Tick combate");
    }

    if(tick % 10 === 0){
      console.log("🌍 Tick mundo");
      spawnMob();
    }

    if(tick % 20 === 0){
      console.log("👑 Tick boss");
    }

  },1000);

}

module.exports = { startGameTick };
