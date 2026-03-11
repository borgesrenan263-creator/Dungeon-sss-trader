function rollMobBySector(sector = 1) {
  const mobs = [
    { name: "Slime", baseHp: 30, baseAtk: 3 },
    { name: "Goblin", baseHp: 40, baseAtk: 5 },
    { name: "Wolf", baseHp: 50, baseAtk: 6 },
    { name: "Orc", baseHp: 70, baseAtk: 9 },
    { name: "Skeleton", baseHp: 60, baseAtk: 8 }
  ];

  const mob = mobs[Math.floor(Math.random() * mobs.length)];

  return {
    name: mob.name,
    hp: mob.baseHp + sector * 10,
    atk: mob.baseAtk + sector * 2,
    sector
  };
}

function createBossMob(sector = 1) {
  return {
    name: "Sector Boss",
    hp: 200 + sector * 40,
    atk: 20 + sector * 5,
    sector,
    isBoss: true
  };
}

module.exports = {
  rollMobBySector,
  createBossMob
};
