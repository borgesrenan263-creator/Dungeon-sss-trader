const { spawnMob } = require("../game/engine/world.spawn");
const { randomWorldEvent } = require("./events.engine");

function startWorldLoop() {

  console.log("🌍 World Loop iniciado");

  setInterval(() => {

    const mob = spawnMob(5);
    console.log("⚔ Mob spawnado:", mob.name);

  }, 5000);


  setInterval(() => {

    const event = randomWorldEvent();
    console.log("🌎 EVENTO GLOBAL:", event);

  }, 15000);

}

module.exports = {
  startWorldLoop
};
