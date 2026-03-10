const { xpNeeded } = require("./engine");

function createGameplayPlayer() {
  return {
    id: 1,
    nickname: "TestHero",
    class: "Cavaleiro",
    level: 1,
    xp: 0,
    gold: 100,
    hp: 140,
    maxHp: 140,
    unspentPoints: 0,
    attributes: {
      str: 0,
      def: 0,
      agi: 0,
      vit: 0
    },
    baseStats: {
      atk: 12,
      def: 16,
      agi: 6,
      maxHp: 140
    }
  };
}

function gainXp(player, amount) {
  player.xp += amount;

  while (player.xp >= xpNeeded(player.level)) {
    player.xp -= xpNeeded(player.level);
    player.level += 1;
    player.unspentPoints += 5;
    player.baseStats.atk += 2;
    player.baseStats.def += 1;
    player.baseStats.agi += 1;
    player.baseStats.maxHp += 12;
  }

  player.maxHp = player.baseStats.maxHp + (player.attributes.vit * 12);
  player.hp = player.maxHp;

  return player;
}

function allocateStats(player, points) {
  const total =
    (points.str || 0) +
    (points.def || 0) +
    (points.agi || 0) +
    (points.vit || 0);

  if (total > player.unspentPoints) {
    throw new Error("not_enough_points");
  }

  player.attributes.str += points.str || 0;
  player.attributes.def += points.def || 0;
  player.attributes.agi += points.agi || 0;
  player.attributes.vit += points.vit || 0;

  player.unspentPoints -= total;

  return {
    ...player,
    finalStats: {
      atk: player.baseStats.atk + (player.attributes.str * 2),
      def: player.baseStats.def + (player.attributes.def * 2),
      agi: player.baseStats.agi + (player.attributes.agi * 2),
      maxHp: player.baseStats.maxHp + (player.attributes.vit * 12)
    }
  };
}

module.exports = {
  createGameplayPlayer,
  gainXp,
  allocateStats
};
