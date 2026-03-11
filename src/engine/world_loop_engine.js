const {
  markWorldLoopStarted,
  markEconomyTick,
  markBossSpawn,
  markGlobalEvent,
  markMobSpawn
} = require("./telemetry_engine");

const worldState = {
  ticks: 0,
  mobsSpawned: 0,
  activeGalaxyBoss: null,
  globalEvents: [],
  onlinePlayers: [],
  economy: {
    prices: {
      iron_sword: 100,
      leather_armor: 80,
      apprentice_ring: 100,
      refine_stone: 120,
      mana_crystal_f: 80,
      mana_crystal: 160
    },
    supply: {
      iron_sword: 10,
      leather_armor: 10,
      apprentice_ring: 10,
      refine_stone: 20,
      mana_crystal_f: 30,
      mana_crystal: 15
    },
    demand: {
      iron_sword: 10,
      leather_armor: 10,
      apprentice_ring: 10,
      refine_stone: 20,
      mana_crystal_f: 30,
      mana_crystal: 15
    },
    npcTradeLog: []
  }
};

const mobs = ["Slime", "Goblin", "Wolf", "Skeleton", "Orc"];

const events = [
  "✨ Drop raro aumentado",
  "⚔️ Invasão de monstros",
  "💰 Economia aquecida",
  "🔥 Boss despertou",
  "🧪 Bonus de XP global",
  "💰 Evento de ouro dobrado"
];

const economyItems = [
  "iron_sword",
  "leather_armor",
  "apprentice_ring",
  "refine_stone",
  "mana_crystal_f",
  "mana_crystal"
];

let started = false;
let intervalRef = null;

function random(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getWorldState() {
  return worldState;
}

function spawnWorldMob() {
  const mob = random(mobs);
  worldState.mobsSpawned += 1;
  markMobSpawn();
  return mob;
}

function triggerGlobalEvent() {
  const event = random(events);
  worldState.globalEvents.push(event);

  if (worldState.globalEvents.length > 10) {
    worldState.globalEvents.shift();
  }

  markGlobalEvent();
  return event;
}

function maybeSpawnGalaxyBoss() {
  if (worldState.ticks > 0 && worldState.ticks % 30 === 0) {
    worldState.activeGalaxyBoss = {
      name: "Galaxy Sovereign",
      hp: 5000,
      maxHp: 5000,
      alive: true
    };
    markBossSpawn();
    return worldState.activeGalaxyBoss;
  }

  return null;
}

function processEconomyTick() {
  const itemId = random(economyItems);
  const tradeType = Math.random() < 0.5 ? "BUY" : "SELL";
  const currentPrice = worldState.economy.prices[itemId] || 100;
  const delta = Math.floor(Math.random() * 30) + 1;

  let nextPrice = currentPrice;

  if (tradeType === "BUY") {
    nextPrice += delta;
  } else {
    nextPrice -= delta;
  }

  if (nextPrice < 1) {
    nextPrice = 1;
  }

  worldState.economy.prices[itemId] = nextPrice;

  const trade = {
    type: tradeType,
    itemId,
    price: nextPrice,
    tick: worldState.ticks
  };

  worldState.economy.npcTradeLog.push(trade);

  if (worldState.economy.npcTradeLog.length > 20) {
    worldState.economy.npcTradeLog.shift();
  }

  markEconomyTick();
  return trade;
}

function startWorldLoop(state = worldState, hooks = {}) {
  if (started) {
    return intervalRef;
  }

  started = true;
  markWorldLoopStarted();

  const onTick = typeof hooks.onTick === "function" ? hooks.onTick : null;
  const onMobSpawn = typeof hooks.onMobSpawn === "function" ? hooks.onMobSpawn : null;
  const onEvent = typeof hooks.onEvent === "function" ? hooks.onEvent : null;
  const onEconomyTick = typeof hooks.onEconomyTick === "function" ? hooks.onEconomyTick : null;
  const onBossSpawn = typeof hooks.onBossSpawn === "function" ? hooks.onBossSpawn : null;

  console.log("🌍 World simulation started");

  intervalRef = setInterval(() => {
    state.ticks += 1;
    worldState.ticks = state.ticks;

    if (onTick) {
      onTick(worldState);
    }

    if (Math.random() < 0.6) {
      const mob = spawnWorldMob();
      console.log("🌍 World Spawn:", mob, "| Total spawns:", worldState.mobsSpawned);

      if (onMobSpawn) {
        onMobSpawn({
          mob,
          total: worldState.mobsSpawned,
          ticks: worldState.ticks
        });
      }
    }

    if (Math.random() < 0.15) {
      const event = triggerGlobalEvent();
      console.log("📢 Evento Global:", event);

      if (onEvent) {
        onEvent({
          event,
          ticks: worldState.ticks
        });
      }
    }

    if (state.ticks % 5 === 0) {
      const trade = processEconomyTick();
      console.log("💹 Economy Tick:", trade.type, trade.itemId, "| preço:", trade.price);

      if (onEconomyTick) {
        onEconomyTick(trade);
      }
    }

    const boss = maybeSpawnGalaxyBoss();
    if (boss) {
      console.log("👑 Galaxy Boss surgiu no mundo:", boss.name);

      if (onBossSpawn) {
        onBossSpawn(boss);
      }
    }
  }, 2000);

  return intervalRef;
}

module.exports = {
  getWorldState,
  spawnWorldMob,
  triggerGlobalEvent,
  maybeSpawnGalaxyBoss,
  processEconomyTick,
  startWorldLoop
};
