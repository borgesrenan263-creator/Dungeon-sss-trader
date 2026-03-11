const players = new Map();

function getOnlinePlayers() {
  return Array.from(players.values());
}

function joinPlayer(name) {
  const player = {
    name,
    x: 0,
    y: 0,
    hp: 100,
    online: true
  };

  players.set(name, player);
  return player;
}

function movePlayer(name, dx, dy) {
  const player = players.get(name);
  if (!player) return null;

  player.x += dx;
  player.y += dy;

  return player;
}

function attackPlayer(attackerName, targetName) {
  const attacker = players.get(attackerName);
  const target = players.get(targetName);

  if (!attacker || !target) return null;

  const damage = Math.floor(Math.random() * 20) + 5;

  target.hp -= damage;

  if (target.hp < 0) {
    target.hp = 0;
  }

  return {
    attacker: attacker.name,
    target: target.name,
    damage,
    targetHp: target.hp
  };
}

function leavePlayer(name) {
  players.delete(name);
}

module.exports = {
  joinPlayer,
  movePlayer,
  attackPlayer,
  leavePlayer,
  getOnlinePlayers
};
