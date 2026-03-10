function getSectorTier(sector) {
  if (sector <= 10) return 1;
  if (sector <= 50) return 2;
  if (sector <= 100) return 3;
  if (sector <= 200) return 4;
  return 5;
}

function getSectorName(sector) {
  const tier = getSectorTier(sector);

  const names = {
    1: "Green Frontier",
    2: "Ash Valley",
    3: "Shadow Corridor",
    4: "Void Frontier",
    5: "Galaxy Ruins"
  };

  return names[tier];
}

function getSectorMobPool(sector) {
  const tier = getSectorTier(sector);

  const pools = {
    1: ["Slime", "Wolf", "Goblin"],
    2: ["Orc", "Skeleton", "Dark Wolf"],
    3: ["Shadow Knight", "Phantom", "Abyss Mage"],
    4: ["Void Beast", "Chaos Reaper", "Astral Golem"],
    5: ["Galaxy Beast", "Cosmic Horror", "Star Devourer"]
  };

  return pools[tier];
}

function getSectorDifficultyMultiplier(sector) {
  return 1 + (sector - 1) * 0.05;
}

function createSectorPlayer(name = "Hero") {
  return {
    name,
    sector: 1
  };
}

function moveToSector(player, sector) {
  player.sector = sector;

  return {
    ok: true,
    sector,
    name: getSectorName(sector),
    tier: getSectorTier(sector)
  };
}

function isBossSector(sector) {
  return sector % 10 === 0;
}

function getSectorBoss(sector) {
  if (!isBossSector(sector)) return null;

  const tier = getSectorTier(sector);

  const bosses = {
    1: "Forest Tyrant",
    2: "Ash Colossus",
    3: "Shadow King",
    4: "Void Emperor",
    5: "Galaxy Sovereign"
  };

  return bosses[tier];
}

module.exports = {
  getSectorTier,
  getSectorName,
  getSectorMobPool,
  getSectorDifficultyMultiplier,
  createSectorPlayer,
  moveToSector,
  isBossSector,
  getSectorBoss
};
