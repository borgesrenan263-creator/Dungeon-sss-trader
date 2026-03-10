const { MOBS_BY_ZONE } = require("../data/mobs.db");

function spawnMob(zoneId = 1) {
  const resolvedZone = MOBS_BY_ZONE[zoneId] ? zoneId : 1;
  const mobs = MOBS_BY_ZONE[resolvedZone];

  const index = Math.floor(Math.random() * mobs.length);

  return {
    name: mobs[index],
    zone: resolvedZone,
    hp: 20 + resolvedZone * 5
  };
}

module.exports = {
  spawnMob
};
