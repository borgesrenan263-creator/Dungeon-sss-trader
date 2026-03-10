const { ZONES } = require("./zones.db");

function getZone(zoneId) {
  return ZONES[zoneId] || ZONES[1];
}

function canEnterZone(player, zoneId) {

  const zone = getZone(zoneId);

  if (player.level < zone.minLevel) {
    return {
      ok:false,
      error:"level_too_low",
      required:zone.minLevel
    };
  }

  return {
    ok:true,
    zone
  };
}

function recommendZone(player) {

  for (const id in ZONES) {

    const zone = ZONES[id];

    if (
      player.level >= zone.minLevel &&
      player.level <= zone.maxLevel
    ) {
      return zone;
    }

  }

  return ZONES[1];
}

module.exports = {
  getZone,
  canEnterZone,
  recommendZone
};
