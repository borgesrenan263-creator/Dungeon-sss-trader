const { initDB, saveDB } = require("../config/database");

const MAP_NODES_SEED = [
  { sector_id: 1, node_type: "sector", node_key: "shadow_forest", display_name: "Shadow Forest", pos_x: 8, pos_y: 42, danger_level: 1, is_hub: 0, is_dungeon: 0, is_boss_zone: 0 },
  { sector_id: 2, node_type: "sector", node_key: "ancient_ruins", display_name: "Ancient Ruins", pos_x: 18, pos_y: 36, danger_level: 2, is_hub: 0, is_dungeon: 0, is_boss_zone: 0 },
  { sector_id: 3, node_type: "sector", node_key: "crimson_caverns", display_name: "Crimson Caverns", pos_x: 28, pos_y: 30, danger_level: 3, is_hub: 0, is_dungeon: 1, is_boss_zone: 0 },
  { sector_id: 4, node_type: "sector", node_key: "obsidian_desert", display_name: "Obsidian Desert", pos_x: 40, pos_y: 27, danger_level: 4, is_hub: 0, is_dungeon: 0, is_boss_zone: 0 },
  { sector_id: 5, node_type: "sector", node_key: "eclipse_valley", display_name: "Eclipse Valley", pos_x: 52, pos_y: 31, danger_level: 5, is_hub: 0, is_dungeon: 1, is_boss_zone: 0 },
  { sector_id: 6, node_type: "sector", node_key: "storm_plateau", display_name: "Storm Plateau", pos_x: 63, pos_y: 38, danger_level: 6, is_hub: 0, is_dungeon: 0, is_boss_zone: 0 },
  { sector_id: 7, node_type: "sector", node_key: "void_marsh", display_name: "Void Marsh", pos_x: 72, pos_y: 46, danger_level: 7, is_hub: 0, is_dungeon: 0, is_boss_zone: 0 },
  { sector_id: 8, node_type: "sector", node_key: "celestial_domain", display_name: "Celestial Domain", pos_x: 80, pos_y: 33, danger_level: 8, is_hub: 0, is_dungeon: 1, is_boss_zone: 0 },
  { sector_id: 9, node_type: "sector", node_key: "abyss_gate", display_name: "Abyss Gate", pos_x: 88, pos_y: 22, danger_level: 9, is_hub: 0, is_dungeon: 0, is_boss_zone: 1 },
  { sector_id: 10, node_type: "sector", node_key: "galaxy_rift", display_name: "Galaxy Rift", pos_x: 94, pos_y: 12, danger_level: 10, is_hub: 0, is_dungeon: 1, is_boss_zone: 1 },
  { sector_id: 0, node_type: "hub", node_key: "central_hub", display_name: "Nexus Obsidian", pos_x: 35, pos_y: 55, danger_level: 0, is_hub: 1, is_dungeon: 0, is_boss_zone: 0 }
];

const MAP_LINKS_SEED = [
  ["central_hub", "shadow_forest"],
  ["central_hub", "ancient_ruins"],
  ["shadow_forest", "ancient_ruins"],
  ["ancient_ruins", "crimson_caverns"],
  ["crimson_caverns", "obsidian_desert"],
  ["obsidian_desert", "eclipse_valley"],
  ["eclipse_valley", "storm_plateau"],
  ["storm_plateau", "void_marsh"],
  ["void_marsh", "celestial_domain"],
  ["celestial_domain", "abyss_gate"],
  ["abyss_gate", "galaxy_rift"]
];

async function ensureWorldMapTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS world_map_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER DEFAULT 0,
      node_type TEXT NOT NULL,
      node_key TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      pos_x INTEGER NOT NULL,
      pos_y INTEGER NOT NULL,
      danger_level INTEGER DEFAULT 0,
      is_hub INTEGER DEFAULT 0,
      is_dungeon INTEGER DEFAULT 0,
      is_boss_zone INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS world_map_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_node_key TEXT NOT NULL,
      to_node_key TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS world_map_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      sector_id INTEGER DEFAULT 0,
      title TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT
    )
  `);

  saveDB();
}

async function seedWorldMap() {
  const db = await initDB();

  for (const node of MAP_NODES_SEED) {
    const existing = db.exec(
      `SELECT id
       FROM world_map_nodes
       WHERE node_key = ?`,
      [String(node.node_key)]
    );

    if (existing.length && existing[0].values.length) continue;

    db.run(
      `INSERT INTO world_map_nodes (
        sector_id,
        node_type,
        node_key,
        display_name,
        pos_x,
        pos_y,
        danger_level,
        is_hub,
        is_dungeon,
        is_boss_zone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(node.sector_id),
        String(node.node_type),
        String(node.node_key),
        String(node.display_name),
        Number(node.pos_x),
        Number(node.pos_y),
        Number(node.danger_level),
        Number(node.is_hub),
        Number(node.is_dungeon),
        Number(node.is_boss_zone)
      ]
    );
  }

  for (const link of MAP_LINKS_SEED) {
    const existing = db.exec(
      `SELECT id
       FROM world_map_links
       WHERE from_node_key = ?
         AND to_node_key = ?`,
      [String(link[0]), String(link[1])]
    );

    if (existing.length && existing[0].values.length) continue;

    db.run(
      `INSERT INTO world_map_links (
        from_node_key,
        to_node_key
      ) VALUES (?, ?)`,
      [String(link[0]), String(link[1])]
    );
  }

  saveDB();
}

async function getMapNodes() {
  const db = await initDB();

  const nodesResult = db.exec(`
    SELECT id, sector_id, node_type, node_key, display_name, pos_x, pos_y,
           danger_level, is_hub, is_dungeon, is_boss_zone
    FROM world_map_nodes
    ORDER BY
      CASE WHEN is_hub = 1 THEN 0 ELSE 1 END,
      danger_level ASC,
      id ASC
  `);

  if (!nodesResult.length) return [];

  const dominationResult = db.exec(`
    SELECT sector_id, dominant_class, gold_bonus_percent, drop_bonus_percent, updated_at
    FROM sector_domination
  `);

  const dominationMap = new Map();

  if (dominationResult.length) {
    for (const row of dominationResult[0].values) {
      dominationMap.set(Number(row[0]), {
        dominant_class: row[1],
        gold_bonus_percent: row[2],
        drop_bonus_percent: row[3],
        updated_at: row[4]
      });
    }
  }

  return nodesResult[0].values.map((row) => {
    const sectorId = Number(row[1]);
    const dom = dominationMap.get(sectorId) || null;

    return {
      node_id: row[0],
      sector_id: sectorId,
      node_type: row[2],
      node_key: row[3],
      display_name: row[4],
      pos_x: row[5],
      pos_y: row[6],
      danger_level: row[7],
      is_hub: Boolean(row[8]),
      is_dungeon: Boolean(row[9]),
      is_boss_zone: Boolean(row[10]),
      domination: dom
    };
  });
}

async function getMapLinks() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id, from_node_key, to_node_key
    FROM world_map_links
    ORDER BY id ASC
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    link_id: row[0],
    from_node_key: row[1],
    to_node_key: row[2]
  }));
}

async function getMapEvents() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id, event_type, sector_id, title, description, is_active, created_at, ended_at
    FROM world_map_events
    ORDER BY id DESC
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    event_id: row[0],
    event_type: row[1],
    sector_id: row[2],
    title: row[3],
    description: row[4],
    is_active: Boolean(row[5]),
    created_at: row[6],
    ended_at: row[7]
  }));
}

async function getSectorMapDetails(sectorId) {
  const db = await initDB();

  const sectorResult = db.exec(
    `SELECT id, sector_name, min_level, max_level, recommended_power, gold_bonus_percent, drop_bonus_percent
     FROM world_sectors
     WHERE id = ?`,
    [Number(sectorId)]
  );

  if (!sectorResult.length || !sectorResult[0].values.length) {
    throw new Error("sector not found");
  }

  const sector = sectorResult[0].values[0];

  const nodeResult = db.exec(
    `SELECT id, node_key, display_name, pos_x, pos_y, danger_level, is_hub, is_dungeon, is_boss_zone
     FROM world_map_nodes
     WHERE sector_id = ?`,
    [Number(sectorId)]
  );

  const monsterResult = db.exec(
    `SELECT id, name, monster_key, hp, attack
     FROM monsters
     WHERE sector = ?
     ORDER BY id ASC`,
    [Number(sectorId)]
  );

  const dominationResult = db.exec(
    `SELECT sector_id, dominant_class, gold_bonus_percent, drop_bonus_percent, updated_at
     FROM sector_domination
     WHERE sector_id = ?`,
    [Number(sectorId)]
  );

  const dungeonResult = db.exec(
    `SELECT id, dungeon_name, min_level, recommended_power, boss_name
     FROM dungeons
     WHERE id = ?`,
    [Number(sectorId)]
  );

  const eventsResult = db.exec(
    `SELECT id, event_type, title, description, is_active, created_at, ended_at
     FROM world_map_events
     WHERE sector_id = ?
     ORDER BY id DESC`,
    [Number(sectorId)]
  );

  return {
    sector: {
      sector_id: sector[0],
      sector_name: sector[1],
      min_level: sector[2],
      max_level: sector[3],
      recommended_power: sector[4],
      base_gold_bonus_percent: sector[5],
      base_drop_bonus_percent: sector[6]
    },
    node: !nodeResult.length || !nodeResult[0].values.length ? null : {
      node_id: nodeResult[0].values[0][0],
      node_key: nodeResult[0].values[0][1],
      display_name: nodeResult[0].values[0][2],
      pos_x: nodeResult[0].values[0][3],
      pos_y: nodeResult[0].values[0][4],
      danger_level: nodeResult[0].values[0][5],
      is_hub: Boolean(nodeResult[0].values[0][6]),
      is_dungeon: Boolean(nodeResult[0].values[0][7]),
      is_boss_zone: Boolean(nodeResult[0].values[0][8])
    },
    domination: !dominationResult.length || !dominationResult[0].values.length ? null : {
      sector_id: dominationResult[0].values[0][0],
      dominant_class: dominationResult[0].values[0][1],
      gold_bonus_percent: dominationResult[0].values[0][2],
      drop_bonus_percent: dominationResult[0].values[0][3],
      updated_at: dominationResult[0].values[0][4]
    },
    monsters: !monsterResult.length ? [] : monsterResult[0].values.map((row) => ({
      monster_id: row[0],
      monster_name: row[1],
      monster_key: row[2],
      hp: row[3],
      attack: row[4]
    })),
    dungeon: !dungeonResult.length || !dungeonResult[0].values.length ? null : {
      dungeon_id: dungeonResult[0].values[0][0],
      dungeon_name: dungeonResult[0].values[0][1],
      min_level: dungeonResult[0].values[0][2],
      recommended_power: dungeonResult[0].values[0][3],
      boss_name: dungeonResult[0].values[0][4]
    },
    events: !eventsResult.length ? [] : eventsResult[0].values.map((row) => ({
      event_id: row[0],
      event_type: row[1],
      title: row[2],
      description: row[3],
      is_active: Boolean(row[4]),
      created_at: row[5],
      ended_at: row[6]
    }))
  };
}

async function getWorldMapPayload() {
  const nodes = await getMapNodes();
  const links = await getMapLinks();
  const events = await getMapEvents();

  return {
    ok: true,
    map_name: "Nexus Obsidian World Map",
    total_nodes: nodes.length,
    total_links: links.length,
    total_events: events.length,
    nodes,
    links,
    events
  };
}

module.exports = {
  ensureWorldMapTables,
  seedWorldMap,
  getMapNodes,
  getMapLinks,
  getMapEvents,
  getSectorMapDetails,
  getWorldMapPayload
};
