const players = new Map();
let lastCreatedPlayerName = null;

function createInventory() {
  return {
    equipments: [],
    materials: [],
    consumables: [],
    drops: []
  };
}

function touchPlayer(player) {
  if (!player) return null;

  if (!player.inventory) {
    player.inventory = createInventory();
  }

  if (!Array.isArray(player.inventory.equipments)) {
    player.inventory.equipments = [];
  }

  if (!Array.isArray(player.inventory.materials)) {
    player.inventory.materials = [];
  }

  if (!Array.isArray(player.inventory.consumables)) {
    player.inventory.consumables = [];
  }

  if (!Array.isArray(player.inventory.drops)) {
    player.inventory.drops = [];
  }

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

function buildPlayer(name, nickname) {
  return touchPlayer({
    name: name || nickname || "AutoPlayer",
    nickname: nickname || name || "AutoPlayer"
  });
}

function ensurePlayer(name, nickname) {
  const resolvedName = name || nickname || lastCreatedPlayerName || "AutoPlayer";

  if (!players.has(resolvedName)) {
    players.set(
      resolvedName,
      buildPlayer(resolvedName, nickname || resolvedName)
    );
  }

  const player = touchPlayer(players.get(resolvedName));
  lastCreatedPlayerName = resolvedName;
  return player;
}

function getPlayerByName(name) {
  if (name && players.has(name)) {
    return touchPlayer(players.get(name));
  }

  return ensurePlayer(name || "AutoPlayer", name || "AutoPlayer");
}

function getLastCreatedPlayer() {
  if (lastCreatedPlayerName && players.has(lastCreatedPlayerName)) {
    return touchPlayer(players.get(lastCreatedPlayerName));
  }

  return ensurePlayer("AutoPlayer", "AutoPlayer");
}

function getAllPlayers() {
  return Array.from(players.values()).map(touchPlayer);
}

function resetPlayers() {
  players.clear();
  lastCreatedPlayerName = null;
}

module.exports = {
  ensurePlayer,
  getPlayerByName,
  getLastCreatedPlayer,
  getAllPlayers,
  resetPlayers
};
