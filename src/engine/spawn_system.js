const mobs = [
  "Slime",
  "Wolf",
  "Goblin"
];

function spawnMob(){

  const mob = mobs[Math.floor(Math.random() * mobs.length)];

  console.log("👾 Mob spawnado:", mob);

  return mob;

}

module.exports = { spawnMob };
