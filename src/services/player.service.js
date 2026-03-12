const {
  ensurePlayer,
  getPlayerByName,
  getAllPlayers
} = require("../api/state/game.state");

function createPlayer(name, nickname) {
  return ensurePlayer(name, nickname);
}

function loginPlayer(name, nickname) {
  const player = ensurePlayer(name, nickname || name);
  player.isOnline = true;
  return player;
}

function logoutPlayer(name) {
  const player = getPlayerByName(name);
  if (!player) return null;

  player.isOnline = false;
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

  player.sector = sector;
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
