const players = new Map();

function addPlayer(player) {

  players.set(player.id, {
    id: player.id,
    name: player.name || "Player",
    level: player.level || 1,
    xp: player.xp || 0,
    hp: player.hp || 100,
    zone: player.zone || 1,
    inventory: []
  });

}

function getPlayer(id) {
  return players.get(id);
}

function removePlayer(id) {
  players.delete(id);
}

function getOnlinePlayers() {
  return Array.from(players.values());
}

module.exports = {
  addPlayer,
  getPlayer,
  removePlayer,
  getOnlinePlayers
};
