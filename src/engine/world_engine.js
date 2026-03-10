const ZONES = {
  1: {
    id: 1,
    name: "Green Fields",
    mobs: ["Slime"]
  },
  2: {
    id: 2,
    name: "Wolf Forest",
    mobs: ["Wolf"]
  },
  3: {
    id: 3,
    name: "Goblin Camp",
    mobs: ["Goblin"]
  }
};

function createWorldPlayer(name = "Hero") {
  return {
    name,
    zone: 1,
    hp: 100,
    maxHp: 100
  };
}

function getZone(zoneId) {
  return ZONES[zoneId] || ZONES[1];
}

function moveToZone(player, zoneId) {
  const zone = getZone(zoneId);
  player.zone = zone.id;

  return {
    ok: true,
    zone
  };
}

function getZoneMobPool(zoneId) {
  const zone = getZone(zoneId);
  return zone.mobs;
}

module.exports = {
  ZONES,
  createWorldPlayer,
  getZone,
  moveToZone,
  getZoneMobPool
};
