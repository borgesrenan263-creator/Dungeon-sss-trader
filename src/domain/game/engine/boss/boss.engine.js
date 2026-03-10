let bossState = {
  active: false,
  name: "Galaxy Overlord",
  hp: 10000,
  players: [],
  lastSpawn: 0,
  cooldown: 60000
};

function spawnBoss() {

  const now = Date.now();

  if (bossState.active) {
    return bossState;
  }

  if (now - bossState.lastSpawn < bossState.cooldown) {
    return null;
  }

  bossState.active = true;
  bossState.lastSpawn = now;
  bossState.hp = 10000;
  bossState.players = [];

  console.log("🐉 BOSS GALAXY SPAWNOU!");

  return bossState;
}

function joinBossFight(playerId) {

  if (!bossState.active) {
    return { ok: false, error: "boss_not_active" };
  }

  if (bossState.players.length >= 20) {
    return { ok: false, error: "boss_full" };
  }

  if (!bossState.players.includes(playerId)) {
    bossState.players.push(playerId);
  }

  return {
    ok: true,
    players: bossState.players.length
  };
}

function defeatBoss() {

  bossState.active = false;

  console.log("🏆 Boss derrotado!");

}

function getBossState() {
  return bossState;
}

module.exports = {
  spawnBoss,
  joinBossFight,
  defeatBoss,
  getBossState
};
