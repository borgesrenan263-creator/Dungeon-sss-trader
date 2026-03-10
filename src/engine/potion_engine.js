function autoUsePotion(player) {
  const threshold = Math.floor(player.maxHp * 0.3);

  if (player.hp <= threshold) {
    const heal = 30;
    player.hp += heal;

    if (player.hp > player.maxHp) {
      player.hp = player.maxHp;
    }

    return {
      used: true,
      heal,
      hp: player.hp
    };
  }

  return {
    used: false,
    heal: 0,
    hp: player.hp
  };
}

module.exports = {
  autoUsePotion
};
