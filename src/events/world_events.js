function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomSector() {
  return randomFrom([
    "Shadow Forest",
    "Ancient Ruins",
    "Crimson Caverns",
    "Obsidian Desert",
    "Eclipse Valley",
    "Storm Plateau",
    "Void Marsh",
    "Celestial Domain",
    "Abyss Gate",
    "Galaxy Rift"
  ]);
}

function buildRandomWorldEvent() {
  const sector = randomSector();

  const events = [
    {
      type: "boss_spawn",
      title: "Boss Galaxy Spawn",
      message: `Um boss raro apareceu em ${sector}.`,
      sector,
      reward: "Galaxy Rune"
    },
    {
      type: "meteor_strike",
      title: "Meteor Strike",
      message: `Um meteoro caiu em ${sector} trazendo cristais raros.`,
      sector,
      reward: "Mana Crystals"
    },
    {
      type: "corruption_zone",
      title: "Corruption Zone",
      message: `${sector} foi corrompido e os monstros ficaram mais fortes.`,
      sector,
      reward: "Dark Essence"
    },
    {
      type: "guild_war_alert",
      title: "Guild War Alert",
      message: `Conflito de guildas detectado em ${sector}.`,
      sector,
      reward: "Territory Control"
    }
  ];

  return {
    ...randomFrom(events),
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  buildRandomWorldEvent
};
