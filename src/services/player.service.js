const {
  ensurePlayer,
  getPlayerByName,
  getAllPlayers
} = require("../api/state/game.state");
const { emitGameEvent } = require("../realtime/game.events");

function createPlayer(name, nickname) {
  const player = ensurePlayer(name, nickname);

  emitGameEvent("player.created", {
    name: player.name,
    nickname: player.nickname,
    level: player.level
  });

  return player;
}

function loginPlayer(name, nickname) {
  const player = ensurePlayer(name, nickname || name);
  player.isOnline = true;

  emitGameEvent("player.login", {
    name: player.name,
    nickname: player.nickname,
    level: player.level
  });

  return player;
}

function logoutPlayer(name) {
  const player = getPlayerByName(name);
  if (!player) return null;

  player.isOnline = false;

  emitGameEvent("player.logout", {
    name: player.name,
    nickname: player.nickname,
    level: player.level
  });

  return player;
}

function getPlayer(name) {
  return getPlayerByName(name);
}

function getPlayerStatus(name) {
  return getPlayerByName(name);
}

function movePlayerSector(name, sector) {
  const player = getPlayerByName(name);
  if (!player) return null;

  const fromSector = player.sector;
  player.sector = sector;

  emitGameEvent("player.move_sector", {
    name: player.name,
    nickname: player.nickname,
    fromSector,
    toSector: player.sector
  });

  return player;
}

function getOnlinePlayers() {
  return getAllPlayers().filter((p) => p.isOnline);
}

module.exports = {
  createPlayer,
  loginPlayer,
  logoutPlayer,
  getPlayer,
  getPlayerStatus,
  movePlayerSector,
  getOnlinePlayers
};
