function calculateDamage(attackerAtk, defenderDef) {
  const raw = attackerAtk - Math.floor(defenderDef * 0.35);
  return Math.max(2, raw);
}

function xpNeeded(level) {
  return level * 25;
}

function applyLevelUp(player) {
  while (player.xp >= xpNeeded(player.level)) {
    player.xp -= xpNeeded(player.level);
    player.level += 1;
    player.unspentPoints = (player.unspentPoints || 0) + 5;
    player.baseStats.maxHp += 12;
    player.baseStats.atk += 2;
    player.baseStats.def += 1;
    player.baseStats.agi += 1;
  }
  return player;
}

function getAttributeBonus(attributes) {
  return {
    hp: (attributes.vit || 0) * 12,
    atk: (attributes.str || 0) * 2,
    def: (attributes.def || 0) * 2,
    agi: (attributes.agi || 0) * 2
  };
}

function sellCrystal(crystals, rank, values) {
  const amount = crystals[rank] || 0;
  const total = amount * values[rank];
  return {
    goldEarned: total,
    newAmount: 0
  };
}

function forgeAttempt(chance, roll) {
  return roll < chance;
}

function rewardVictory(player, monster, crystalRank = "F") {
  const xpGain = 8 + Math.floor(monster.level / 2);
  const goldGain = 5 + Math.floor(monster.level / 3);

  player.xp += xpGain;
  player.gold += goldGain;

  if (!player.crystals) {
    player.crystals = { F: 0, E: 0, D: 0, C: 0, B: 0, A: 0, SS: 0 };
  }

  if (!player.crystals[crystalRank]) {
    player.crystals[crystalRank] = 0;
  }

  player.crystals[crystalRank] += 1;

  applyLevelUp(player);

  return {
    player,
    rewards: {
      xpGain,
      goldGain,
      crystalRank
    }
  };
}

function simulateBattleRound(player, monster) {
  const playerDamage = calculateDamage(player.atk, monster.def);
  monster.hp = Math.max(0, monster.hp - playerDamage);

  let monsterDamage = 0;

  if (monster.hp > 0) {
    monsterDamage = calculateDamage(monster.atk, player.def);
    player.hp = Math.max(0, player.hp - monsterDamage);
  }

  return {
    player,
    monster,
    playerDamage,
    monsterDamage,
    monsterDefeated: monster.hp <= 0,
    playerDefeated: player.hp <= 0
  };
}

module.exports = {
  calculateDamage,
  xpNeeded,
  applyLevelUp,
  getAttributeBonus,
  sellCrystal,
  forgeAttempt,
  rewardVictory,
  simulateBattleRound
};
