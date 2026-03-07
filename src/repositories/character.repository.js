const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

async function ensureCharacterTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS character_progression (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER UNIQUE NOT NULL,
      strength INTEGER DEFAULT 5,
      dexterity INTEGER DEFAULT 5,
      intelligence INTEGER DEFAULT 5,
      vitality INTEGER DEFAULT 5,
      stat_points INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function seedCharacterProgression() {
  const db = await initDB();

  const players = db.exec(`
    SELECT id
    FROM players
    ORDER BY id ASC
  `);

  if (!players.length) {
    return;
  }

  for (const row of players[0].values) {
    const playerId = row[0];

    const existing = db.exec(
      `SELECT id FROM character_progression WHERE player_id = ?`,
      [Number(playerId)]
    );

    if (existing.length && existing[0].values.length) continue;

    db.run(
      `INSERT INTO character_progression (
        player_id,
        strength,
        dexterity,
        intelligence,
        vitality,
        stat_points,
        updated_at
      ) VALUES (?, 5, 5, 5, 5, 0, CURRENT_TIMESTAMP)`,
      [Number(playerId)]
    );
  }

  saveDB();
}

function xpNeededForNextLevel(level) {
  const safeLevel = Number(level) || 1;
  return safeLevel * 100;
}

async function getCharacterStats(playerId) {
  const db = await initDB();

  const playerResult = db.exec(
    `SELECT id, nickname, class, level, xp
     FROM players
     WHERE id = ?`,
    [Number(playerId)]
  );

  if (!playerResult.length || !playerResult[0].values.length) {
    throw new Error("player not found");
  }

  const player = playerResult[0].values[0];

  const progressionResult = db.exec(
    `SELECT strength, dexterity, intelligence, vitality, stat_points, updated_at
     FROM character_progression
     WHERE player_id = ?`,
    [Number(playerId)]
  );

  if (!progressionResult.length || !progressionResult[0].values.length) {
    throw new Error("character progression not found");
  }

  const stats = progressionResult[0].values[0];
  const nextLevelXp = xpNeededForNextLevel(player[3]);

  return {
    player_id: player[0],
    nickname: player[1],
    class: player[2],
    level: player[3],
    xp: player[4],
    xp_next_level: nextLevelXp,
    attributes: {
      strength: stats[0],
      dexterity: stats[1],
      intelligence: stats[2],
      vitality: stats[3]
    },
    stat_points: stats[4],
    updated_at: stats[5],
    derived: {
      attack_power: stats[0] * 2 + stats[1],
      magic_power: stats[2] * 2,
      max_hp: 100 + stats[3] * 20,
      crit_chance: stats[1],
      defense: stats[3] * 2
    }
  };
}

async function gainCharacterXp({ playerId, xpAmount }) {
  const db = await initDB();

  const safeXp = Number(xpAmount) || 0;
  if (safeXp <= 0) {
    throw new Error("invalid xp amount");
  }

  const playerResult = db.exec(
    `SELECT id, nickname, level, xp
     FROM players
     WHERE id = ?`,
    [Number(playerId)]
  );

  if (!playerResult.length || !playerResult[0].values.length) {
    throw new Error("player not found");
  }

  const player = playerResult[0].values[0];
  let currentLevel = Number(player[2]);
  let currentXp = Number(player[3]) + safeXp;
  let levelsGained = 0;
  let statPointsGained = 0;

  while (currentXp >= xpNeededForNextLevel(currentLevel)) {
    currentXp -= xpNeededForNextLevel(currentLevel);
    currentLevel += 1;
    levelsGained += 1;
    statPointsGained += 5;
  }

  db.run(
    `UPDATE players
     SET level = ?, xp = ?
     WHERE id = ?`,
    [currentLevel, currentXp, Number(playerId)]
  );

  if (statPointsGained > 0) {
    db.run(
      `UPDATE character_progression
       SET stat_points = stat_points + ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE player_id = ?`,
      [statPointsGained, Number(playerId)]
    );
  } else {
    db.run(
      `UPDATE character_progression
       SET updated_at = CURRENT_TIMESTAMP
       WHERE player_id = ?`,
      [Number(playerId)]
    );
  }

  saveDB();

  if (levelsGained > 0) {
    await createEvent({
      eventType: "character_level_up",
      title: "Level Up",
      message: `✨ ${player[1]} reached level ${currentLevel}`,
      metadata: {
        player_id: Number(playerId),
        old_level: Number(player[2]),
        new_level: currentLevel,
        levels_gained: levelsGained
      }
    });
  }

  return {
    player_id: Number(playerId),
    xp_added: safeXp,
    level: currentLevel,
    xp_current: currentXp,
    levels_gained: levelsGained,
    stat_points_gained: statPointsGained
  };
}

async function allocateStats({ playerId, strength = 0, dexterity = 0, intelligence = 0, vitality = 0 }) {
  const db = await initDB();

  const addStr = Number(strength) || 0;
  const addDex = Number(dexterity) || 0;
  const addInt = Number(intelligence) || 0;
  const addVit = Number(vitality) || 0;

  if (addStr < 0 || addDex < 0 || addInt < 0 || addVit < 0) {
    throw new Error("negative allocation is not allowed");
  }

  const total = addStr + addDex + addInt + addVit;
  if (total <= 0) {
    throw new Error("no stat points allocated");
  }

  const progressionResult = db.exec(
    `SELECT strength, dexterity, intelligence, vitality, stat_points
     FROM character_progression
     WHERE player_id = ?`,
    [Number(playerId)]
  );

  if (!progressionResult.length || !progressionResult[0].values.length) {
    throw new Error("character progression not found");
  }

  const row = progressionResult[0].values[0];
  const availablePoints = Number(row[4]);

  if (availablePoints < total) {
    throw new Error("insufficient stat points");
  }

  db.run(
    `UPDATE character_progression
     SET strength = strength + ?,
         dexterity = dexterity + ?,
         intelligence = intelligence + ?,
         vitality = vitality + ?,
         stat_points = stat_points - ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE player_id = ?`,
    [
      addStr,
      addDex,
      addInt,
      addVit,
      total,
      Number(playerId)
    ]
  );

  saveDB();

  return await getCharacterStats(playerId);
}

module.exports = {
  ensureCharacterTables,
  seedCharacterProgression,
  getCharacterStats,
  gainCharacterXp,
  allocateStats
};
