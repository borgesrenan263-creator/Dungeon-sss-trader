const { ZONES } = require("./zones.config");

function getAllZones() {
  return ZONES;
}

function getZoneById(id) {
  return ZONES.find(zone => zone.id === Number(id)) || null;
}

function canEnterZone(playerLevel, zoneId) {
  const zone = getZoneById(zoneId);

  if (!zone) {
    return {
      ok: false,
      error: "zone_not_found"
    };
  }

  if (playerLevel < zone.minLevel) {
    return {
      ok: false,
      error: "level_too_low",
      requiredLevel: zone.minLevel
    };
  }

  return {
    ok: true,
    zone
  };
}

function getRecommendedZone(playerLevel) {
  const zone = ZONES.find(z =>
    playerLevel >= z.minLevel && playerLevel <= z.maxLevel
  );

  return zone || ZONES[ZONES.length - 1];
}

module.exports = {
  getAllZones,
  getZoneById,
  canEnterZone,
  getRecommendedZone
};
