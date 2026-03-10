function rollLoot() {

  const table = [
    { item: "Mana Crystal", rarity: "common", chance: 60 },
    { item: "Iron Sword", rarity: "uncommon", chance: 25 },
    { item: "Knight Armor", rarity: "rare", chance: 10 },
    { item: "Galaxy Rune", rarity: "legendary", chance: 5 }
  ];

  const roll = Math.random() * 100;

  let cumulative = 0;

  for (const entry of table) {
    cumulative += entry.chance;

    if (roll <= cumulative) {
      return entry;
    }
  }

  return table[0];
}

module.exports = {
  rollLoot
};
