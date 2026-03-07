const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

const HUB_NPCS = [
  {
    npc_key: "auction_master",
    npc_name: "Auction Master Orion",
    role: "auction",
    location_tag: "auction_hall",
    description: "Official auction manager for rare items and premium bids."
  },
  {
    npc_key: "exchange_banker",
    npc_name: "Banker Nexus",
    role: "exchange",
    location_tag: "exchange_bank",
    description: "Handles gold, obsidian and premium exchange operations."
  },
  {
    npc_key: "forge_master",
    npc_name: "Forge Master Vulcan",
    role: "forge",
    location_tag: "forge_square",
    description: "Responsible for weapon upgrades, risk forging and reinforcement."
  },
  {
    npc_key: "potion_vendor",
    npc_name: "Alchemist Ether",
    role: "potion",
    location_tag: "alchemy_corner",
    description: "Sells potions, consumables and utility flasks."
  },
  {
    npc_key: "storage_keeper",
    npc_name: "Vault Keeper Arkon",
    role: "storage",
    location_tag: "vault_hall",
    description: "Controls player vault access and premium storage tabs."
  },
  {
    npc_key: "guild_officer",
    npc_name: "Guild Officer Valen",
    role: "guild",
    location_tag: "guild_board",
    description: "Guild registry, wars, notices and territory administration."
  }
];

const HUB_FACILITIES = [
  {
    facility_key: "auction_hall",
    facility_name: "Auction Hall",
    facility_type: "auction",
    status: "active",
    description: "Premium auction house for rare and high-value item disputes."
  },
  {
    facility_key: "exchange_bank",
    facility_name: "Exchange Bank",
    facility_type: "exchange",
    status: "active",
    description: "Official conversion hub for gold, obsidian and premium currencies."
  },
  {
    facility_key: "forge_square",
    facility_name: "Forge Square",
    facility_type: "forge",
    status: "active",
    description: "Main forge district for upgrades, stability stones and crafting risk."
  },
  {
    facility_key: "alchemy_corner",
    facility_name: "Alchemy Corner",
    facility_type: "shop",
    status: "active",
    description: "Potion and support item district."
  },
  {
    facility_key: "vault_hall",
    facility_name: "Vault Hall",
    facility_type: "storage",
    status: "active",
    description: "Safe player storage access with premium chest upgrades."
  },
  {
    facility_key: "trade_street",
    facility_name: "Trade Street",
    facility_type: "player_market",
    status: "active",
    description: "Dedicated area for personal stalls and player commerce."
  },
  {
    facility_key: "guild_board",
    facility_name: "Guild Board",
    facility_type: "guild",
    status: "active",
    description: "Guild recruitment, notices and war administration."
  }
];

async function ensureCityTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS city_npcs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      npc_key TEXT UNIQUE NOT NULL,
      npc_name TEXT NOT NULL,
      role TEXT NOT NULL,
      location_tag TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS city_facilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      facility_key TEXT UNIQUE NOT NULL,
      facility_name TEXT NOT NULL,
      facility_type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS city_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER UNIQUE NOT NULL,
      in_hub INTEGER DEFAULT 1,
      current_zone TEXT DEFAULT 'central_plaza',
      entered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS city_stalls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      stall_name TEXT NOT NULL,
      zone_key TEXT DEFAULT 'trade_street',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function seedCityData() {
  const db = await initDB();

  for (const npc of HUB_NPCS) {
    const existing = db.exec(
      `SELECT id FROM city_npcs WHERE npc_key = ?`,
      [npc.npc_key]
    );

    if (existing.length && existing[0].values.length) continue;

    db.run(
      `INSERT INTO city_npcs (
        npc_key,
        npc_name,
        role,
        location_tag,
        description
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        npc.npc_key,
        npc.npc_name,
        npc.role,
        npc.location_tag,
        npc.description
      ]
    );
  }

  for (const facility of HUB_FACILITIES) {
    const existing = db.exec(
      `SELECT id FROM city_facilities WHERE facility_key = ?`,
      [facility.facility_key]
    );

    if (existing.length && existing[0].values.length) continue;

    db.run(
      `INSERT INTO city_facilities (
        facility_key,
        facility_name,
        facility_type,
        status,
        description
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        facility.facility_key,
        facility.facility_name,
        facility.facility_type,
        facility.status,
        facility.description
      ]
    );
  }

  saveDB();
}

async function getCityOverview() {
  const db = await initDB();

  const npcs = db.exec(`SELECT COUNT(*) FROM city_npcs`);
  const facilities = db.exec(`SELECT COUNT(*) FROM city_facilities`);
  const onlinePlayers = db.exec(`SELECT COUNT(*) FROM city_players WHERE in_hub = 1`);
  const activeStalls = db.exec(`SELECT COUNT(*) FROM city_stalls WHERE active = 1`);

  return {
    city_name: "Nexus Obsidian",
    city_role: "central_hub",
    npcs: Number(npcs[0]?.values?.[0]?.[0] || 0),
    facilities: Number(facilities[0]?.values?.[0]?.[0] || 0),
    players_in_hub: Number(onlinePlayers[0]?.values?.[0]?.[0] || 0),
    active_stalls: Number(activeStalls[0]?.values?.[0]?.[0] || 0)
  };
}

async function getCityNpcs() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id, npc_key, npc_name, role, location_tag, description
    FROM city_npcs
    ORDER BY id ASC
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    npc_key: row[1],
    npc_name: row[2],
    role: row[3],
    location_tag: row[4],
    description: row[5]
  }));
}

async function getCityFacilities() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id, facility_key, facility_name, facility_type, status, description
    FROM city_facilities
    ORDER BY id ASC
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    facility_key: row[1],
    facility_name: row[2],
    facility_type: row[3],
    status: row[4],
    description: row[5]
  }));
}

async function enterCity({ playerId, zone = "central_plaza" }) {
  const db = await initDB();

  const player = db.exec(
    `SELECT id, nickname FROM players WHERE id = ?`,
    [Number(playerId)]
  );

  if (!player.length || !player[0].values.length) {
    throw new Error("player not found");
  }

  const playerNickname = player[0].values[0][1];

  const existing = db.exec(
    `SELECT id FROM city_players WHERE player_id = ?`,
    [Number(playerId)]
  );

  if (existing.length && existing[0].values.length) {
    db.run(
      `UPDATE city_players
       SET in_hub = 1,
           current_zone = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE player_id = ?`,
      [String(zone), Number(playerId)]
    );
  } else {
    db.run(
      `INSERT INTO city_players (
        player_id,
        in_hub,
        current_zone,
        entered_at,
        updated_at
      ) VALUES (?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [Number(playerId), String(zone)]
    );
  }

  saveDB();

  await createEvent({
    eventType: "city_enter",
    title: "Player Entered Hub City",
    message: `🏙️ ${playerNickname} entered Nexus Obsidian`,
    metadata: {
      player_id: Number(playerId),
      zone: String(zone)
    }
  });

  return {
    player_id: Number(playerId),
    in_hub: true,
    current_zone: String(zone)
  };
}

async function leaveCity({ playerId }) {
  const db = await initDB();

  const existing = db.exec(
    `SELECT id FROM city_players WHERE player_id = ?`,
    [Number(playerId)]
  );

  if (!existing.length || !existing[0].values.length) {
    throw new Error("player is not registered in city");
  }

  db.run(
    `UPDATE city_players
     SET in_hub = 0,
         updated_at = CURRENT_TIMESTAMP
     WHERE player_id = ?`,
    [Number(playerId)]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    in_hub: false
  };
}

async function getCityPlayers() {
  const db = await initDB();

  const result = db.exec(`
    SELECT cp.id, cp.player_id, p.nickname, p.class, cp.in_hub, cp.current_zone, cp.updated_at
    FROM city_players cp
    INNER JOIN players p ON p.id = cp.player_id
    WHERE cp.in_hub = 1
    ORDER BY cp.id DESC
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    city_presence_id: row[0],
    player_id: row[1],
    nickname: row[2],
    class: row[3],
    in_hub: Boolean(row[4]),
    current_zone: row[5],
    updated_at: row[6]
  }));
}

async function openCityStall({ playerId, stallName, zoneKey = "trade_street" }) {
  const db = await initDB();

  const player = db.exec(
    `SELECT id, nickname FROM players WHERE id = ?`,
    [Number(playerId)]
  );

  if (!player.length || !player[0].values.length) {
    throw new Error("player not found");
  }

  const nickname = player[0].values[0][1];

  const existing = db.exec(
    `SELECT id FROM city_stalls
     WHERE player_id = ?
       AND active = 1`,
    [Number(playerId)]
  );

  if (existing.length && existing[0].values.length) {
    throw new Error("player already has an active stall");
  }

  db.run(
    `INSERT INTO city_stalls (
      player_id,
      stall_name,
      zone_key,
      active,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [Number(playerId), String(stallName), String(zoneKey)]
  );

  saveDB();

  const created = db.exec(`
    SELECT id, player_id, stall_name, zone_key, active, created_at
    FROM city_stalls
    ORDER BY id DESC
    LIMIT 1
  `);

  const row = created[0].values[0];

  await createEvent({
    eventType: "city_stall_open",
    title: "Player Stall Opened",
    message: `🛒 ${nickname} opened stall ${row[2]} in ${row[3]}`,
    metadata: {
      stall_id: row[0],
      player_id: row[1],
      stall_name: row[2],
      zone_key: row[3]
    }
  });

  return {
    stall_id: row[0],
    player_id: row[1],
    stall_name: row[2],
    zone_key: row[3],
    active: Boolean(row[4]),
    created_at: row[5]
  };
}

async function closeCityStall({ playerId, stallId }) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, player_id, stall_name, active
     FROM city_stalls
     WHERE id = ?`,
    [Number(stallId)]
  );

  if (!result.length || !result[0].values.length) {
    throw new Error("stall not found");
  }

  const row = result[0].values[0];

  if (Number(row[1]) !== Number(playerId)) {
    throw new Error("stall does not belong to player");
  }

  if (!Number(row[3])) {
    throw new Error("stall already closed");
  }

  db.run(
    `UPDATE city_stalls
     SET active = 0,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [Number(stallId)]
  );

  saveDB();

  return {
    stall_id: Number(row[0]),
    player_id: Number(row[1]),
    stall_name: row[2],
    active: false
  };
}

async function getActiveCityStalls() {
  const db = await initDB();

  const result = db.exec(`
    SELECT cs.id, cs.player_id, p.nickname, cs.stall_name, cs.zone_key, cs.active, cs.created_at
    FROM city_stalls cs
    INNER JOIN players p ON p.id = cs.player_id
    WHERE cs.active = 1
    ORDER BY cs.id DESC
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    stall_id: row[0],
    player_id: row[1],
    nickname: row[2],
    stall_name: row[3],
    zone_key: row[4],
    active: Boolean(row[5]),
    created_at: row[6]
  }));
}

module.exports = {
  ensureCityTables,
  seedCityData,
  getCityOverview,
  getCityNpcs,
  getCityFacilities,
  enterCity,
  leaveCity,
  getCityPlayers,
  openCityStall,
  closeCityStall,
  getActiveCityStalls
};
