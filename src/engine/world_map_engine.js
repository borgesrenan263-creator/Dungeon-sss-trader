const world = {
  tick: 0,
  sectors: [
    {
      id: 1,
      name: "Green Plains",
      levelRange: "1-10",
      mobs: ["Slime", "Wolf"],
      npcs: ["Potion Merchant"],
      control: "neutral",
      spawns: 0
    },
    {
      id: 2,
      name: "Goblin Camp",
      levelRange: "10-20",
      mobs: ["Goblin", "Goblin Archer"],
      npcs: ["Blacksmith"],
      control: "neutral",
      spawns: 0
    },
    {
      id: 3,
      name: "Crystal Cave",
      levelRange: "20-35",
      mobs: ["Crystal Bat", "Stone Golem"],
      npcs: ["Refine Master"],
      control: "neutral",
      spawns: 0
    },
    {
      id: 4,
      name: "Shadow Forest",
      levelRange: "35-50",
      mobs: ["Shadow Wolf", "Dark Elf"],
      npcs: ["Hunter Trainer"],
      control: "neutral",
      spawns: 0
    },
    {
      id: 5,
      name: "Ruined Fortress",
      levelRange: "50-80",
      mobs: ["Skeleton", "Dark Knight"],
      npcs: ["Armor Merchant"],
      control: "neutral",
      spawns: 0
    }
  ],
  recentSpawns: []
};

function getWorld() {
  return world;
}

function getSectors() {
  return world.sectors;
}

function getSectorById(id) {
  return world.sectors.find((sector) => sector.id === Number(id)) || null;
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function spawnInSector(sectorId) {
  const sector = getSectorById(sectorId);
  if (!sector) return null;

  const mob = randomFrom(sector.mobs);

  sector.spawns += 1;

  const spawn = {
    tick: world.tick,
    sectorId: sector.id,
    sectorName: sector.name,
    mob
  };

  world.recentSpawns.push(spawn);

  if (world.recentSpawns.length > 20) {
    world.recentSpawns.shift();
  }

  return spawn;
}

function advanceWorldTick() {
  world.tick += 1;

  const sector = randomFrom(world.sectors);
  const spawn = spawnInSector(sector.id);

  return {
    tick: world.tick,
    spawn
  };
}

module.exports = {
  getWorld,
  getSectors,
  getSectorById,
  spawnInSector,
  advanceWorldTick
};
