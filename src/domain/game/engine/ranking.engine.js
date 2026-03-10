const ranking = [];

function updateRanking(player) {

  const existing = ranking.find(p => p.id === player.id);

  if (existing) {
    existing.level = player.level;
    existing.xp = player.xp;
  } else {

    ranking.push({
      id: player.id,
      name: player.name || "Player",
      level: player.level,
      xp: player.xp
    });

  }

  ranking.sort((a,b) => {
    if (b.level !== a.level) {
      return b.level - a.level;
    }
    return b.xp - a.xp;
  });

}

function getTopPlayers(limit = 10) {
  return ranking.slice(0, limit);
}

module.exports = {
  updateRanking,
  getTopPlayers
};
