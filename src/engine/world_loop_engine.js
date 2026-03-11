const { createGalaxyBoss } = require("./galaxy_boss_engine");

let worldState = {
  ticks: 0,
  mobsSpawned: 0,
  globalEvents: [],
  activeGalaxyBoss: null
};

function spawnWorldMob() {
  const mobs = ["Slime", "Wolf", "Goblin", "Orc", "Skeleton"];
  const mob = mobs[Math.floor(Math.random() * mobs.length)];

  worldState.mobsSpawned += 1;

  console.log("🌍 World Spawn:", mob, "| Total spawns:", worldState.mobsSpawned);

  return mob;
}

function triggerGlobalEvent() {
  const events = [
    "💰 Evento de ouro dobrado",
    "✨ Drop raro aumentado",
    "⚔️ Invasão de monstros",
    "🧪 Bônus de XP global"
  ];

  const event = events[Math.floor(Math.random() * events.length)];
  worldState.globalEvents.push(event);

  console.log("📢 Evento Global:", event);

  return event;
}

function maybeSpawnGalaxyBoss() {
  if (worldState.ticks > 0 && worldState.ticks % 30 === 0) {
    worldState.activeGalaxyBoss = createGalaxyBoss();
    console.log("🌌 Galaxy Boss surgiu no mundo:", worldState.activeGalaxyBoss.name);
    return worldState.activeGalaxyBoss;
  }

  return null;
}

function startWorldLoopEngine() {
  console.log("🌐 World Loop Engine iniciado");

  setInterval(() => {
    worldState.ticks += 1;

    console.log("⏱️ World Tick:", worldState.ticks);

    if (worldState.ticks % 5 === 0) {
      spawnWorldMob();
    }

    if (worldState.ticks % 10 === 0) {
      triggerGlobalEvent();
    }

    maybeSpawnGalaxyBoss();
  }, 1000);
}

function getWorldState() {
  return worldState;
}

module.exports = {
  startWorldLoopEngine,
  getWorldState,
  spawnWorldMob,
  triggerGlobalEvent,
  maybeSpawnGalaxyBoss
};
