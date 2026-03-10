function simulateBossRaid(players, boss) {

  const damageBoard = [];

  players.forEach(player => {

    const damage =
      player.baseStats.atk +
      Math.floor(Math.random() * 10);

    damageBoard.push({
      playerId: player.id,
      nickname: player.nickname,
      damage
    });

    boss.hp -= damage;

  });

  damageBoard.sort((a,b) => b.damage - a.damage);

  const totalDamage = damageBoard.reduce(
    (sum,p) => sum + p.damage,
    0
  );

  const winner =
    damageBoard[Math.floor(
      Math.random() * damageBoard.length
    )];

  return {
    bossDefeated: boss.hp <= 0,
    totalDamage,
    ranking: damageBoard,
    lootWinner: winner.nickname
  };
}

module.exports = {
  simulateBossRaid
};
