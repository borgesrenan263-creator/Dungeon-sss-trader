function createPlayer(name) {
  return {
    name,
    level: 1,
    xp: 0,
    rankPoints: 0
  };
}

function gainXp(player, amount) {
  player.xp += amount;

  const xpNeeded = player.level * 20;

  if (player.xp >= xpNeeded) {
    player.level += 1;
    player.xp = 0;
    player.rankPoints += 10;
  }

  return player;
}

function calculateRank(players) {
  return players.sort((a,b) => b.rankPoints - a.rankPoints);
}

module.exports = {
  createPlayer,
  gainXp,
  calculateRank
};
