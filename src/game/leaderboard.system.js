function updateLeaderboard(players) {

  const sorted = players.sort((a,b) => b.rankPoints - a.rankPoints);

  return sorted.slice(0,10);

}

function getTopPlayer(players) {

  const sorted = players.sort((a,b) => b.rankPoints - a.rankPoints);

  return sorted[0];

}

module.exports = {
  updateLeaderboard,
  getTopPlayer
};
