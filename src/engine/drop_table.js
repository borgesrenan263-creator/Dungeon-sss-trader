const DROP_TABLE = {
  Slime: [
    { type: "material", id: "mana_crystal_f", name: "Mana Crystal F" },
    { type: "material", id: "refine_stone", name: "Refine Stone" }
  ],
  Wolf: [
    { type: "equipment", id: "leather_armor", name: "Leather Armor" },
    { type: "material", id: "mana_crystal_e", name: "Mana Crystal E" }
  ],
  Goblin: [
    { type: "equipment", id: "iron_sword", name: "Iron Sword" },
    { type: "material", id: "refine_stone", name: "Refine Stone" }
  ]
};

function rollDrop(mobName) {
  const pool = DROP_TABLE[mobName] || [
    { type: "material", id: "mana_crystal_f", name: "Mana Crystal F" }
  ];

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

module.exports = {
  DROP_TABLE,
  rollDrop
};
