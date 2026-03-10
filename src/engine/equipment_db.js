const EQUIPMENT_DB = {
  iron_sword: {
    id: "iron_sword",
    name: "Iron Sword",
    slot: "weapon",
    bonus: {
      str: 3,
      dex: 1,
      int: 0,
      vit: 0
    }
  },
  leather_armor: {
    id: "leather_armor",
    name: "Leather Armor",
    slot: "armor",
    bonus: {
      str: 0,
      dex: 1,
      int: 0,
      vit: 4
    }
  },
  apprentice_ring: {
    id: "apprentice_ring",
    name: "Apprentice Ring",
    slot: "ring",
    bonus: {
      str: 0,
      dex: 0,
      int: 3,
      vit: 1
    }
  }
};

module.exports = {
  EQUIPMENT_DB
};
