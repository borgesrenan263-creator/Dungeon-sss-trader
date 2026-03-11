const players = new Map();

function connectPlayer(id) {
  players.set(id, {
    id,
    x: 0,
    y: 0,
    hp: 100,
    online: true
  });

  return players.get(id);
}

function disconnectPlayer(id) {
  players.delete(id);
}

function movePlayer(id, x, y) {
  const p = players.get(id);
  if (!p) return null;

  p.x = x;
  p.y = y;

  return p;
}

function getPlayers() {
  return Array.from(players.values());
}

module.exports = {
  connectPlayer,
  disconnectPlayer,
  movePlayer,
  getPlayers
};
