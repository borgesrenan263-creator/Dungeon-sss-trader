const { spawnMob } = require("../game/engine/world.spawn");
const { randomWorldEvent } = require("./events.engine");
const { spawnBoss } = require("../game/engine/boss/boss.engine");
const { addMob, addEvent, setBoss } = require("./world.state");

function startWorldLoop() {

  console.log("🌍 World Loop iniciado");

  setInterval(() => {

    const zone = Math.floor(Math.random() * 10) + 1;
    const mob = spawnMob(zone);

    addMob(mob);

    console.log("⚔ Mob spawnado:", mob.name, "| Zona:", zone);

  }, 5000);

  setInterval(() => {

    const event = randomWorldEvent();

    addEvent(event);

    console.log("🌎 EVENTO GLOBAL:", event);

    if (event.includes("Boss")) {

      const boss = spawnBoss();

      if (boss) {
        setBoss(boss);
      }

    }

  }, 15000);

}

module.exports = {
  startWorldLoop
};
