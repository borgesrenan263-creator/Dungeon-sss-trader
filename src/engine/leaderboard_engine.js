function getTopByGold(playersMap) {
  return Object.values(playersMap)
    .sort((a, b) => (b.gold || 0) - (a.gold || 0))
    .slice(0, 10)
    .map((player, index) => ({
      rank: index + 1,
      name: player.name,
      gold: player.gold || 0
    }));
}

function getTopByPvp(playersMap) {
  return Object.values(playersMap)
    .sort((a, b) => (b.pvpWins || 0) - (a.pvpWins || 0))
    .slice(0, 10)
    .map((player, index) => ({
      rank: index + 1,
      name: player.name,
      wins: player.pvpWins || 0,
      losses: player.pvpLosses || 0
    }));
}

module.exports = {
  getTopByGold,
  getTopByPvp
};
