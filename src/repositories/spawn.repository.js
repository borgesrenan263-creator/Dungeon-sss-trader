const { initDB, saveDB } = require("../config/database");

async function ensureSpawnTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS sector_monsters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      monster_key TEXT NOT NULL,
      monster_name TEXT NOT NULL,
      min_level INTEGER NOT NULL,
      max_level INTEGER NOT NULL,
      base_hp INTEGER NOT NULL,
      base_attack INTEGER NOT NULL,
      spawn_weight INTEGER NOT NULL,
      crystal_bonus_percent REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function ensureSectorMonster(db, spawn) {
  const existing = db.exec(
    `SELECT id
     FROM sector_monsters
     WHERE sector_id = ?
       AND monster_key = ?;`,
    [spawn.sector_id, spawn.monster_key]
  );

  if (existing.length && existing[0].values.length) return;

  db.run(
    `INSERT INTO sector_monsters (
      sector_id,
      monster_key,
      monster_name,
      min_level,
      max_level,
      base_hp,
      base_attack,
      spawn_weight,
      crystal_bonus_percent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      spawn.sector_id,
      spawn.monster_key,
      spawn.monster_name,
      spawn.min_level,
      spawn.max_level,
      spawn.base_hp,
      spawn.base_attack,
      spawn.spawn_weight,
      spawn.crystal_bonus_percent
    ]
  );
}

async function seedSectorMonsters() {
  const db = await initDB();

  const spawns = [
    { sector_id: 1, monster_key: "shadow_slime", monster_name: "Shadow Slime", min_level: 1, max_level: 10, base_hp: 40, base_attack: 4, spawn_weight: 50, crystal_bonus_percent: 0 },
    { sector_id: 1, monster_key: "forest_wolf", monster_name: "Forest Wolf", min_level: 8, max_level: 20, base_hp: 65, base_attack: 7, spawn_weight: 35, crystal_bonus_percent: 0 },
    { sector_id: 1, monster_key: "rookie_goblin", monster_name: "Rookie Goblin", min_level: 15, max_level: 30, base_hp: 90, base_attack: 10, spawn_weight: 15, crystal_bonus_percent: 1 },

    { sector_id: 2, monster_key: "ruin_skeleton", monster_name: "Ruin Skeleton", min_level: 51, max_level: 65, base_hp: 140, base_attack: 18, spawn_weight: 45, crystal_bonus_percent: 1 },
    { sector_id: 2, monster_key: "stone_guardian", monster_name: "Stone Guardian", min_level: 60, max_level: 80, base_hp: 220, base_attack: 24, spawn_weight: 35, crystal_bonus_percent: 2 },
    { sector_id: 2, monster_key: "dark_priest", monster_name: "Dark Priest", min_level: 70, max_level: 100, base_hp: 180, base_attack: 28, spawn_weight: 20, crystal_bonus_percent: 2 },

    { sector_id: 3, monster_key: "crimson_bat", monster_name: "Crimson Bat", min_level: 101, max_level: 120, base_hp: 260, base_attack: 32, spawn_weight: 40, crystal_bonus_percent: 2 },
    { sector_id: 3, monster_key: "cavern_beast", monster_name: "Cavern Beast", min_level: 115, max_level: 135, base_hp: 340, base_attack: 38, spawn_weight: 35, crystal_bonus_percent: 2 },
    { sector_id: 3, monster_key: "blood_miner", monster_name: "Blood Miner", min_level: 130, max_level: 150, base_hp: 390, base_attack: 44, spawn_weight: 25, crystal_bonus_percent: 3 },

    { sector_id: 4, monster_key: "sand_raider", monster_name: "Sand Raider", min_level: 151, max_level: 170, base_hp: 460, base_attack: 50, spawn_weight: 40, crystal_bonus_percent: 2 },
    { sector_id: 4, monster_key: "obsidian_serpent", monster_name: "Obsidian Serpent", min_level: 165, max_level: 185, base_hp: 540, base_attack: 58, spawn_weight: 35, crystal_bonus_percent: 3 },
    { sector_id: 4, monster_key: "dune_executioner", monster_name: "Dune Executioner", min_level: 180, max_level: 200, base_hp: 620, base_attack: 66, spawn_weight: 25, crystal_bonus_percent: 3 },

    { sector_id: 5, monster_key: "eclipse_hound", monster_name: "Eclipse Hound", min_level: 201, max_level: 220, base_hp: 720, base_attack: 74, spawn_weight: 40, crystal_bonus_percent: 3 },
    { sector_id: 5, monster_key: "twilight_archer", monster_name: "Twilight Archer", min_level: 215, max_level: 235, base_hp: 780, base_attack: 82, spawn_weight: 35, crystal_bonus_percent: 3 },
    { sector_id: 5, monster_key: "valley_reaper", monster_name: "Valley Reaper", min_level: 230, max_level: 250, base_hp: 860, base_attack: 90, spawn_weight: 25, crystal_bonus_percent: 4 },

    { sector_id: 6, monster_key: "storm_falcon", monster_name: "Storm Falcon", min_level: 251, max_level: 270, base_hp: 950, base_attack: 98, spawn_weight: 40, crystal_bonus_percent: 3 },
    { sector_id: 6, monster_key: "thunder_ram", monster_name: "Thunder Ram", min_level: 265, max_level: 285, base_hp: 1080, base_attack: 106, spawn_weight: 35, crystal_bonus_percent: 4 },
    { sector_id: 6, monster_key: "plateau_lord", monster_name: "Plateau Lord", min_level: 280, max_level: 300, base_hp: 1180, base_attack: 118, spawn_weight: 25, crystal_bonus_percent: 4 },

    { sector_id: 7, monster_key: "void_frog", monster_name: "Void Frog", min_level: 301, max_level: 320, base_hp: 1260, base_attack: 126, spawn_weight: 40, crystal_bonus_percent: 4 },
    { sector_id: 7, monster_key: "marsh_abomination", monster_name: "Marsh Abomination", min_level: 315, max_level: 335, base_hp: 1400, base_attack: 138, spawn_weight: 35, crystal_bonus_percent: 4 },
    { sector_id: 7, monster_key: "swamp_tyrant", monster_name: "Swamp Tyrant", min_level: 330, max_level: 350, base_hp: 1550, base_attack: 150, spawn_weight: 25, crystal_bonus_percent: 5 },

    { sector_id: 8, monster_key: "sky_sentinel", monster_name: "Sky Sentinel", min_level: 351, max_level: 370, base_hp: 1680, base_attack: 160, spawn_weight: 40, crystal_bonus_percent: 4 },
    { sector_id: 8, monster_key: "celestial_knight", monster_name: "Celestial Knight", min_level: 365, max_level: 385, base_hp: 1820, base_attack: 172, spawn_weight: 35, crystal_bonus_percent: 5 },
    { sector_id: 8, monster_key: "domain_judge", monster_name: "Domain Judge", min_level: 380, max_level: 400, base_hp: 1980, base_attack: 186, spawn_weight: 25, crystal_bonus_percent: 5 },

    { sector_id: 9, monster_key: "abyss_hunter", monster_name: "Abyss Hunter", min_level: 401, max_level: 420, base_hp: 2140, base_attack: 198, spawn_weight: 40, crystal_bonus_percent: 5 },
    { sector_id: 9, monster_key: "rift_mauler", monster_name: "Rift Mauler", min_level: 415, max_level: 435, base_hp: 2320, base_attack: 214, spawn_weight: 35, crystal_bonus_percent: 5 },
    { sector_id: 9, monster_key: "gate_destroyer", monster_name: "Gate Destroyer", min_level: 430, max_level: 450, base_hp: 2520, base_attack: 228, spawn_weight: 25, crystal_bonus_percent: 6 },

    { sector_id: 10, monster_key: "galaxy_demon", monster_name: "Galaxy Demon", min_level: 451, max_level: 470, base_hp: 2760, base_attack: 246, spawn_weight: 40, crystal_bonus_percent: 5 },
    { sector_id: 10, monster_key: "astral_warden", monster_name: "Astral Warden", min_level: 465, max_level: 485, base_hp: 2980, base_attack: 264, spawn_weight: 35, crystal_bonus_percent: 6 },
    { sector_id: 10, monster_key: "void_titan", monster_name: "Void Titan", min_level: 480, max_level: 500, base_hp: 3250, base_attack: 285, spawn_weight: 25, crystal_bonus_percent: 7 }
  ];

  for (const spawn of spawns) {
    await ensureSectorMonster(db, spawn);
  }

  saveDB();
}

function weightedPick(entries) {
  const totalWeight = entries.reduce((sum, item) => sum + Number(item.spawn_weight), 0);
  let roll = Math.random() * totalWeight;

  for (const item of entries) {
    roll -= Number(item.spawn_weight);
    if (roll <= 0) return item;
  }

  return entries[entries.length - 1];
}

async function getSectorSpawnPool(sectorId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id,
            sector_id,
            monster_key,
            monster_name,
            min_level,
            max_level,
            base_hp,
            base_attack,
            spawn_weight,
            crystal_bonus_percent
     FROM sector_monsters
     WHERE sector_id = ?
     ORDER BY id ASC;`,
    [Number(sectorId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    sector_id: row[1],
    monster_key: row[2],
    monster_name: row[3],
    min_level: row[4],
    max_level: row[5],
    base_hp: row[6],
    base_attack: row[7],
    spawn_weight: row[8],
    crystal_bonus_percent: row[9]
  }));
}

async function rollSectorMonster(sectorId) {
  const pool = await getSectorSpawnPool(sectorId);

  if (!pool.length) {
    throw new Error("no monsters configured for this sector");
  }

  const selected = weightedPick(pool);

  const rolledLevel =
    selected.min_level +
    Math.floor(Math.random() * (selected.max_level - selected.min_level + 1));

  const hpScale = 1 + rolledLevel / 200;
  const attackScale = 1 + rolledLevel / 250;

  return {
    sector_id: selected.sector_id,
    monster_key: selected.monster_key,
    monster_name: selected.monster_name,
    rolled_level: rolledLevel,
    scaled_hp: Math.floor(selected.base_hp * hpScale),
    scaled_attack: Math.floor(selected.base_attack * attackScale),
    spawn_weight: selected.spawn_weight,
    crystal_bonus_percent: selected.crystal_bonus_percent
  };
}

module.exports = {
  ensureSpawnTables,
  seedSectorMonsters,
  getSectorSpawnPool,
  rollSectorMonster
};
