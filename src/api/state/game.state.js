const engineState = require("../../engine/game_state");

function touchPlayer(player) {
  if (!player) {
    player = engineState.ensurePlayer("AutoPlayer", "AutoPlayer");
  }

  if (!player.inventory) {
    player.inventory = {
      equipments: [],
      materials: [],
      consumables: [],
      drops: []
    };
  }

  if (!Array.isArray(player.inventory.equipments)) player.inventory.equipments = [];
  if (!Array.isArray(player.inventory.materials)) player.inventory.materials = [];
  if (!Array.isArray(player.inventory.consumables)) player.inventory.consumables = [];
  if (!Array.isArray(player.inventory.drops)) player.inventory.drops = [];

  if (!player.equipped) {
    player.equipped = {
      weapon: null,
      armor: null,
      accessory: null
    };
  }

  if (!player.pvp) {
    player.pvp = {
      wins: 0,
      losses: 0
    };
  }

  if (typeof player.gold !== "number") player.gold = 0;
  if (typeof player.hp !== "number") player.hp = 100;
  if (typeof player.maxHp !== "number") player.maxHp = 100;
  if (typeof player.sector !== "number") player.sector = 1;
  if (typeof player.level !== "number") player.level = 1;
  if (typeof player.xp !== "number") player.xp = 0;
  if (typeof player.xpToNextLevel !== "number") player.xpToNextLevel = 100;
  if (typeof player.isOnline !== "boolean") player.isOnline = false;

  return player;
}

function ensurePlayer(name, nickname) {
  return touchPlayer(
    engineState.ensurePlayer(name || "AutoPlayer", nickname || name || "AutoPlayer")
  );
}

function getPlayerByName(name) {
  return touchPlayer(
    engineState.ensurePlayer(name || "AutoPlayer", name || "AutoPlayer")
  );
}

function getLastCreatedPlayer() {
  return touchPlayer(engineState.getLastCreatedPlayer());
}

function getAllPlayers() {
  return engineState.getAllPlayers().map(touchPlayer);
}

function registerDropForPlayer(name, item) {
  const player = getPlayerByName(name);

  const normalized = {
    id: item?.id || item?.type || item?.name || "item",
    type: item?.type || item?.id || item?.name || "item",
    name: item?.name || item?.type || item?.id || "item"
  };

  if (normalized.type === "material") {
    player.inventory.materials.push(normalized);
  }

  player.inventory.drops.push(normalized);

  return {
    ok: true,
    player,
    drop: normalized
  };
}

module.exports = {
  ensurePlayer,
  getPlayerByName,
  getLastCreatedPlayer,
  getAllPlayers,
  registerDropForPlayer,
  resetPlayers: engineState.resetPlayers
};
