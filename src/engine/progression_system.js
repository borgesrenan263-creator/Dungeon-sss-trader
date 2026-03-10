const { createInventory } = require("./inventory_engine");

function createProgressionPlayer(name) {
  return {
    name,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    gold: 0,
    inventory: createInventory()
  };
}

function applyRewards(player, reward) {
  player.xp += reward.xp;
  player.gold += reward.gold;

  while (player.xp >= player.xpToNextLevel) {
    player.xp -= player.xpToNextLevel;
    player.level += 1;
    player.xpToNextLevel = player.level * 100;
  }

  return player;
}

module.exports = {
  createProgressionPlayer,
  applyRewards
};
