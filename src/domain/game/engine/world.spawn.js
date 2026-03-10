function spawnMob(playerLevel) {

  const mobs = [
    { name: "Slime", baseHp: 30, atk: 4, xp: 5, gold: 3 },
    { name: "Goblin", baseHp: 40, atk: 6, xp: 8, gold: 6 },
    { name: "Wolf", baseHp: 50, atk: 8, xp: 10, gold: 9 }
  ];

  const mob = mobs[Math.floor(Math.random() * mobs.length)];

  return {
    name: mob.name,
    hp: mob.baseHp + playerLevel * 5,
    atk: mob.atk + Math.floor(playerLevel / 2),
    xp: mob.xp + playerLevel,
    gold: mob.gold + Math.floor(playerLevel / 2)
  };
}

module.exports = {
  spawnMob
};
