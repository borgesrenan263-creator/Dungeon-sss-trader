const { run, get, all, initDb } = require("../db/sqlite");

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
}

async function savePlayers(playersMap) {
  await ensureInit();

  const players = Object.values(playersMap || {});

  for (const player of players) {
    await run(
      `INSERT OR REPLACE INTO players (name, data_json)
       VALUES (?, ?)`,
      [
        player.name,
        JSON.stringify(player)
      ]
    );
  }

  return {
    ok: true,
    saved: players.length
  };
}

async function loadPlayers() {
  await ensureInit();

  const rows = await all(`SELECT * FROM players`);

  return rows.map(r => {
    try {
      return JSON.parse(r.data_json);
    } catch {
      return { name: r.name };
    }
  });
}

async function saveWorld(worldState) {
  await ensureInit();

  await run(
    `INSERT OR REPLACE INTO players (name, data_json)
     VALUES (?, ?)`,
    [
      "world_state",
      JSON.stringify(worldState)
    ]
  );

  return { ok: true };
}

async function loadWorld() {
  await ensureInit();

  const row = await get(
    `SELECT * FROM players WHERE name = ?`,
    ["world_state"]
  );

  if (!row) return null;

  try {
    return JSON.parse(row.data_json);
  } catch {
    return null;
  }
}

async function saveMarket(market) {
  await ensureInit();

  await run(
    `INSERT OR REPLACE INTO players (name, data_json)
     VALUES (?, ?)`,
    [
      "market_state",
      JSON.stringify(market)
    ]
  );

  return { ok: true };
}

async function loadMarket() {
  await ensureInit();

  const row = await get(
    `SELECT * FROM players WHERE name = ?`,
    ["market_state"]
  );

  if (!row) return [];

  try {
    return JSON.parse(row.data_json);
  } catch {
    return [];
  }
}

async function initPersistence() {
  await ensureInit();
  return { ok: true };
}

module.exports = {
  initPersistence,
  savePlayers,
  loadPlayers,
  saveWorld,
  loadWorld,
  saveMarket,
  loadMarket
};
