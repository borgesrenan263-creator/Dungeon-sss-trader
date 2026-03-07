const { initDB, saveDB } = require("../config/database");

async function ensureHubTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS hub_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      zone_key TEXT UNIQUE NOT NULL,
      zone_name TEXT NOT NULL,
      zone_type TEXT NOT NULL,
      npc_name TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS player_stalls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      stall_name TEXT NOT NULL,
      zone_key TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      closed_at TEXT
    )
  `);

  saveDB();
}

async function ensureZone(db, zone) {
  const existing = db.exec(
    `SELECT id
     FROM hub_zones
     WHERE zone_key = ?;`,
    [zone.zone_key]
  );

  if (existing.length && existing[0].values.length) return;

  db.run(
    `INSERT INTO hub_zones (
      zone_key,
      zone_name,
      zone_type,
      npc_name,
      description
    ) VALUES (?, ?, ?, ?, ?);`,
    [
      zone.zone_key,
      zone.zone_name,
      zone.zone_type,
      zone.npc_name,
      zone.description
    ]
  );
}

async function seedHubZones() {
  const db = await initDB();

  const zones = [
    {
      zone_key: "portal_plaza",
      zone_name: "Praça do Portal",
      zone_type: "spawn",
      npc_name: "Arauto Astral",
      description: "Entrada principal da cidade e acesso aos setores de farm."
    },
    {
      zone_key: "trade_street",
      zone_name: "Rua das Bancas",
      zone_type: "trade",
      npc_name: "Mestre das Bancas",
      description: "Área social para bancas privadas de jogadores."
    },
    {
      zone_key: "official_market",
      zone_name: "Mercado Oficial",
      zone_type: "shop",
      npc_name: "Mercador Astral",
      description: "Compra oficial de itens premium e serviços do sistema."
    },
    {
      zone_key: "bank_exchange",
      zone_name: "Banco de Exchange",
      zone_type: "exchange",
      npc_name: "Banqueiro Nexus",
      description: "Compra oficial de Obsidiana e troca de Obsidiana por Ouro."
    },
    {
      zone_key: "cosmic_forge",
      zone_name: "Forja Cósmica",
      zone_type: "forge",
      npc_name: "Ferreiro do Vazio",
      description: "Zona oficial de upgrades e uso de Pedra de Estabilidade."
    },
    {
      zone_key: "alchemy_corner",
      zone_name: "Alquimista",
      zone_type: "potions",
      npc_name: "Alquimista Ether",
      description: "Venda de poções e consumíveis."
    },
    {
      zone_key: "auction_hall",
      zone_name: "Salão do Leilão",
      zone_type: "auction",
      npc_name: "Leiloeiro Nexus",
      description: "Busca rápida e negociação de itens raros."
    },
    {
      zone_key: "ascension_way",
      zone_name: "Caminho da Ascensão",
      zone_type: "prestige",
      npc_name: "Guardião Galaxy",
      description: "Exibição de bônus permanentes e status divino."
    }
  ];

  for (const zone of zones) {
    await ensureZone(db, zone);
  }

  saveDB();
}

async function getHubOverview() {
  const db = await initDB();

  const zones = db.exec(`
    SELECT id, zone_key, zone_name, zone_type, npc_name, description
    FROM hub_zones
    ORDER BY id ASC;
  `);

  const stalls = db.exec(`
    SELECT COUNT(*)
    FROM player_stalls
    WHERE active = 1;
  `);

  return {
    city_name: "Nexus Obsidiano",
    total_zones: zones.length ? zones[0].values.length : 0,
    active_stalls: Number(stalls[0]?.values?.[0]?.[0] || 0),
    zones: zones.length
      ? zones[0].values.map((row) => ({
          id: row[0],
          zone_key: row[1],
          zone_name: row[2],
          zone_type: row[3],
          npc_name: row[4],
          description: row[5]
        }))
      : []
  };
}

async function getHubZones() {
  const overview = await getHubOverview();
  return overview.zones;
}

async function openPlayerStall({ playerId, stallName }) {
  const db = await initDB();

  const playerResult = db.exec(
    `SELECT id, nickname
     FROM players
     WHERE id = ?;`,
    [Number(playerId)]
  );

  if (!playerResult.length || !playerResult[0].values.length) {
    throw new Error("player not found");
  }

  const titleResult = db.exec(
    `SELECT player_id, active
     FROM merchant_titles
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  if (!titleResult.length || !titleResult[0].values.length) {
    throw new Error("merchant title required");
  }

  const active = Number(titleResult[0].values[0][1] || 0);

  if (active !== 1) {
    throw new Error("merchant title inactive");
  }

  const existingStall = db.exec(
    `SELECT id
     FROM player_stalls
     WHERE player_id = ?
       AND active = 1;`,
    [Number(playerId)]
  );

  if (existingStall.length && existingStall[0].values.length) {
    throw new Error("player already has an active stall");
  }

  const safeName = String(stallName || "").trim();

  if (!safeName) {
    throw new Error("stall name is required");
  }

  db.run(
    `INSERT INTO player_stalls (
      player_id,
      stall_name,
      zone_key,
      active
    ) VALUES (?, ?, 'trade_street', 1);`,
    [Number(playerId), safeName]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    stall_name: safeName,
    zone_key: "trade_street",
    active: true
  };
}

async function closePlayerStall(playerId) {
  const db = await initDB();

  const activeStall = db.exec(
    `SELECT id, stall_name
     FROM player_stalls
     WHERE player_id = ?
       AND active = 1;`,
    [Number(playerId)]
  );

  if (!activeStall.length || !activeStall[0].values.length) {
    throw new Error("no active stall found");
  }

  const stallId = Number(activeStall[0].values[0][0]);
  const stallName = activeStall[0].values[0][1];

  db.run(
    `UPDATE player_stalls
     SET active = 0,
         closed_at = CURRENT_TIMESTAMP
     WHERE id = ?;`,
    [stallId]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    stall_id: stallId,
    stall_name: stallName,
    active: false
  };
}

async function getActiveStalls() {
  const db = await initDB();

  const result = db.exec(`
    SELECT ps.id,
           ps.player_id,
           p.nickname,
           ps.stall_name,
           ps.zone_key,
           ps.created_at
    FROM player_stalls ps
    INNER JOIN players p ON p.id = ps.player_id
    WHERE ps.active = 1
    ORDER BY ps.id DESC;
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    stall_id: row[0],
    player_id: row[1],
    nickname: row[2],
    stall_name: row[3],
    zone_key: row[4],
    created_at: row[5]
  }));
}

module.exports = {
  ensureHubTables,
  seedHubZones,
  getHubOverview,
  getHubZones,
  openPlayerStall,
  closePlayerStall,
  getActiveStalls
};
