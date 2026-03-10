const { getPlayer } = require("../player/player.state");

const worldPlayers = new Map();

function enterWorld(playerId) {

  const player = getPlayer(playerId);

  if (!player) {
    return { ok:false, error:"player_not_found" };
  }

  worldPlayers.set(playerId, {
    id: playerId,
    zone: player.zone || 1
  });

  return { ok:true };
}

function leaveWorld(playerId) {
  worldPlayers.delete(playerId);
}

function getPlayersInWorld() {
  return Array.from(worldPlayers.values());
}

module.exports = {
  enterWorld,
  leaveWorld,
  getPlayersInWorld
};
