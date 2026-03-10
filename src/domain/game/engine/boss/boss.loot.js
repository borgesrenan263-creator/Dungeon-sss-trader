function rollBossReward(players) {

  if (!players || players.length === 0) {
    return { ok:false };
  }

  const index = Math.floor(Math.random() * players.length);

  const winner = players[index];

  return {
    ok:true,
    winner,
    reward:{
      item:"Galaxy Rune",
      bonus:"+1 permanent stat"
    }
  };

}

module.exports = {
  rollBossReward
};
