
function getWorldOverview() {

  const sectors = [
    { id:1, name:"Shadow Forest", level_min:1, level_max:50 },
    { id:2, name:"Ancient Ruins", level_min:50, level_max:100 },
    { id:3, name:"Crimson Caverns", level_min:100, level_max:150 },
    { id:4, name:"Obsidian Desert", level_min:150, level_max:200 },
    { id:5, name:"Eclipse Valley", level_min:200, level_max:250 },
    { id:6, name:"Storm Plateau", level_min:250, level_max:300 },
    { id:7, name:"Void Marsh", level_min:300, level_max:350 },
    { id:8, name:"Celestial Domain", level_min:350, level_max:400 },
    { id:9, name:"Abyss Gate", level_min:400, level_max:450 },
    { id:10, name:"Galaxy Rift", level_min:450, level_max:500 }
  ];

  return {
    total_sectors: sectors.length,
    world_sectors: sectors,
    total_nodes: sectors.length,
    total_links: 9,
    total_events: 0
  };

}

function getSectorById(id) {

  const sectors = getWorldOverview().world_sectors;

  return sectors.find(s => s.id == id);

}

module.exports = {
  getWorldOverview,
  getSectorById
};

