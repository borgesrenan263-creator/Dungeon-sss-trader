function createGalaxyBoss() {
  return {
    name: "Galaxy Sovereign",
    maxHp: 5000,
    hp: 5000,
    atk: 120,
    participants: [],
    damageTable: {},
    alive: true,
    maxPlayers: 20
  };
}

function joinGalaxyBoss(boss, playerName) {
  if (!boss.alive) {
    return { ok: false, error: "boss_dead" };
  }

  if (boss.participants.length >= boss.maxPlayers) {
    return { ok: false, error: "event_full" };
  }

  if (!boss.participants.includes(playerName)) {
    boss.participants.push(playerName);
    boss.damageTable[playerName] = 0;
  }

  return {
    ok: true,
    players: boss.participants.length
  };
}

function attackGalaxyBoss(boss, playerName, damage) {
  if (!boss.alive) {
    return { ok: false, error: "boss_dead" };
  }

  boss.hp -= damage;

  if (!boss.damageTable[playerName]) {
    boss.damageTable[playerName] = 0;
  }

  boss.damageTable[playerName] += damage;

  if (boss.hp <= 0) {
    boss.hp = 0;
    boss.alive = false;

    return {
      ok: true,
      killed: true
    };
  }

  return {
    ok: true,
    hp: boss.hp
  };
}

function rollGalaxyReward(boss) {
  if (boss.participants.length === 0) {
    return null;
  }

  const winner =
    boss.participants[Math.floor(Math.random() * boss.participants.length)];

  return {
    winner,
    reward: "Rune Galaxy"
  };
}

function finishGalaxyBoss(boss) {
  if (boss.alive) {
    return { ok: false, error: "boss_alive" };
  }

  const reward = rollGalaxyReward(boss);

  return {
    ok: true,
    reward
  };
}

module.exports = {
  createGalaxyBoss,
  joinGalaxyBoss,
  attackGalaxyBoss,
  rollGalaxyReward,
  finishGalaxyBoss
};
