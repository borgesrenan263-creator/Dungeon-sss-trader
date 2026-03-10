function createMob(name, hp, atk) {
  return {
    name,
    hp,
    atk
  };
}

function createPlayer(name, hp, atk) {
  return {
    name,
    hp,
    atk
  };
}

function attack(attacker, defender) {
  const damage = Math.max(1, attacker.atk || 1);

  defender.hp -= damage;

  if (defender.hp < 0) {
    defender.hp = 0;
  }

  return {
    attacker: attacker.name,
    defender: defender.name,
    damage,
    defenderHp: defender.hp,
    defeated: defender.hp === 0
  };
}

module.exports = {
  createMob,
  createPlayer,
  attack
};
