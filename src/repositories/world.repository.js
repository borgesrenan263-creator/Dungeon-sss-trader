const { initDB, saveDB } = require("../config/database");

async function ensureWorldTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS world_sectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_key TEXT UNIQUE NOT NULL,
      sector_name TEXT NOT NULL,
      min_level INTEGER NOT NULL,
      max_level INTEGER NOT NULL,
      recommended_power INTEGER NOT NULL,
      gold_bonus_percent REAL DEFAULT 0,
      drop_bonus_percent REAL DEFAULT 0,
      is_pvp INTEGER DEFAULT 0,
      boss_zone INTEGER DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function ensureSector(db, sector) {
  const existing = db.exec(
    `SELECT id
     FROM world_sectors
     WHERE sector_key = ?;`,
    [sector.sector_key]
  );

  if (existing.length && existing[0].values.length) return;

  db.run(
    `INSERT INTO world_sectors (
      sector_key,
      sector_name,
      min_level,
      max_level,
      recommended_power,
      gold_bonus_percent,
      drop_bonus_percent,
      is_pvp,
      boss_zone,
      description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      sector.sector_key,
      sector.sector_name,
      sector.min_level,
      sector.max_level,
      sector.recommended_power,
      sector.gold_bonus_percent,
      sector.drop_bonus_percent,
      sector.is_pvp ? 1 : 0,
      sector.boss_zone ? 1 : 0,
      sector.description
    ]
  );
}

async function seedWorldSectors() {
  const db = await initDB();

  const sectors = [
    {
      sector_key: "shadow_forest",
      sector_name: "Shadow Forest",
      min_level: 1,
      max_level: 50,
      recommended_power: 100,
      gold_bonus_percent: 0,
      drop_bonus_percent: 0,
      is_pvp: false,
      boss_zone: false,
      description: "Entry sector for beginner farming and low-risk progression."
    },
    {
      sector_key: "ancient_ruins",
      sector_name: "Ancient Ruins",
      min_level: 51,
      max_level: 100,
      recommended_power: 220,
      gold_bonus_percent: 2,
      drop_bonus_percent: 1,
      is_pvp: false,
      boss_zone: false,
      description: "Ruined battlefield with stronger monsters and better crystal flow."
    },
    {
      sector_key: "crimson_caverns",
      sector_name: "Crimson Caverns",
      min_level: 101,
      max_level: 150,
      recommended_power: 360,
      gold_bonus_percent: 3,
      drop_bonus_percent: 2,
      is_pvp: false,
      boss_zone: false,
      description: "Underground bloodstone caves with dense mob concentration."
    },
    {
      sector_key: "obsidian_desert",
      sector_name: "Obsidian Desert",
      min_level: 151,
      max_level: 200,
      recommended_power: 520,
      gold_bonus_percent: 4,
      drop_bonus_percent: 2,
      is_pvp: true,
      boss_zone: false,
      description: "High-risk desert where ambushes and fast farming coexist."
    },
    {
      sector_key: "eclipse_valley",
      sector_name: "Eclipse Valley",
      min_level: 201,
      max_level: 250,
      recommended_power: 700,
      gold_bonus_percent: 5,
      drop_bonus_percent: 3,
      is_pvp: true,
      boss_zone: false,
      description: "Twilight valley with elite monsters and unstable routes."
    },
    {
      sector_key: "storm_plateau",
      sector_name: "Storm Plateau",
      min_level: 251,
      max_level: 300,
      recommended_power: 900,
      gold_bonus_percent: 6,
      drop_bonus_percent: 3,
      is_pvp: true,
      boss_zone: false,
      description: "Plateau of thunder beasts and advanced crystal farming."
    },
    {
      sector_key: "void_marsh",
      sector_name: "Void Marsh",
      min_level: 301,
      max_level: 350,
      recommended_power: 1150,
      gold_bonus_percent: 7,
      drop_bonus_percent: 4,
      is_pvp: true,
      boss_zone: false,
      description: "Corrupted marshland with dangerous density and rare drops."
    },
    {
      sector_key: "celestial_domain",
      sector_name: "Celestial Domain",
      min_level: 351,
      max_level: 400,
      recommended_power: 1450,
      gold_bonus_percent: 8,
      drop_bonus_percent: 4,
      is_pvp: true,
      boss_zone: false,
      description: "Sky-touched war zone for advanced class domination."
    },
    {
      sector_key: "abyss_gate",
      sector_name: "Abyss Gate",
      min_level: 401,
      max_level: 450,
      recommended_power: 1800,
      gold_bonus_percent: 9,
      drop_bonus_percent: 5,
      is_pvp: true,
      boss_zone: false,
      description: "Late-game breach sector filled with abyssal pressure."
    },
    {
      sector_key: "galaxy_rift",
      sector_name: "Galaxy Rift",
      min_level: 451,
      max_level: 500,
      recommended_power: 2200,
      gold_bonus_percent: 10,
      drop_bonus_percent: 5,
      is_pvp: true,
      boss_zone: true,
      description: "Final sector and official Galaxy Boss event zone."
    }
  ];

  for (const sector of sectors) {
    await ensureSector(db, sector);
  }

  saveDB();
}

async function getWorldOverview() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id,
           sector_key,
           sector_name,
           min_level,
           max_level,
           recommended_power,
           gold_bonus_percent,
           drop_bonus_percent,
           is_pvp,
           boss_zone,
           description
    FROM world_sectors
    ORDER BY id ASC;
  `);

  const sectors = result.length
    ? result[0].values.map((row) => ({
        id: row[0],
        sector_key: row[1],
        sector_name: row[2],
        min_level: row[3],
        max_level: row[4],
        recommended_power: row[5],
        gold_bonus_percent: row[6],
        drop_bonus_percent: row[7],
        is_pvp: Boolean(row[8]),
        boss_zone: Boolean(row[9]),
        description: row[10]
      }))
    : [];

  return {
    world_name: "Dungeon SSS Trader World",
    total_sectors: sectors.length,
    sectors
  };
}

async function getSectorById(sectorId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id,
            sector_key,
            sector_name,
            min_level,
            max_level,
            recommended_power,
            gold_bonus_percent,
            drop_bonus_percent,
            is_pvp,
            boss_zone,
            description
     FROM world_sectors
     WHERE id = ?;`,
    [Number(sectorId)]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const row = result[0].values[0];

  return {
    id: row[0],
    sector_key: row[1],
    sector_name: row[2],
    min_level: row[3],
    max_level: row[4],
    recommended_power: row[5],
    gold_bonus_percent: row[6],
    drop_bonus_percent: row[7],
    is_pvp: Boolean(row[8]),
    boss_zone: Boolean(row[9]),
    description: row[10]
  };
}

module.exports = {
  ensureWorldTables,
  seedWorldSectors,
  getWorldOverview,
  getSectorById
};
