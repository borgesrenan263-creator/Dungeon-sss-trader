const { updateRanking } = require("./ranking.engine");

function grantXp(player, amount) {

  if (!player.xp) player.xp = 0;
  if (!player.level) player.level = 1;

  player.xp += amount;

  const xpNeeded = player.level * 100;

  let levelUp = false;

  if (player.xp >= xpNeeded) {
    player.level += 1;
    player.xp = player.xp - xpNeeded;
    levelUp = true;
  }

  updateRanking(player);

  return {
    levelUp,
    level: player.level,
    xp: player.xp
  };
}

module.exports = {
  grantXp
};
