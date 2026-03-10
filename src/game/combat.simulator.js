function simulateCombat(player, mob) {
  let round = 0;

  const log = [];

  while (player.hp > 0 && mob.hp > 0 && round < 20) {
    round++;

    const playerDamage = Math.max(
      1,
      player.baseStats.atk - mob.def
    );

    mob.hp -= playerDamage;

    log.push({
      round,
      attacker: "player",
      damage: playerDamage
    });

    if (mob.hp <= 0) break;

    const mobDamage = Math.max(
      1,
      mob.atk - player.baseStats.def
    );

    player.hp -= mobDamage;

    log.push({
      round,
      attacker: "mob",
      damage: mobDamage
    });
  }

  return {
    winner: player.hp > 0 ? "player" : "mob",
    rounds: round,
    log
  };
}

module.exports = {
  simulateCombat
};
