function getMobReward(mobName) {
  const rewards = {
    Slime:  { xp: 20, gold: 10, drop: "Cristal F" },
    Wolf:   { xp: 35, gold: 18, drop: "Pele de Lobo" },
    Goblin: { xp: 50, gold: 25, drop: "Adaga Quebrada" }
  };

  return rewards[mobName] || { xp: 10, gold: 5, drop: "Item Comum" };
}

module.exports = {
  getMobReward
};
