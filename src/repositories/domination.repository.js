const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

const VALID_CLASSES = ["Knight", "Mage", "Hunter"];
const DOMINATION_GOLD_BONUS = 10;
const DOMINATION_DROP_BONUS = 5;

async function ensureDominationTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS sector_domination (
      sector_id INTEGER PRIMARY KEY,
      dominant_class TEXT NOT NULL,
      gold_bonus_percent REAL DEFAULT 10,
      drop_bonus_percent REAL DEFAULT 5,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS domination_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector_id INTEGER NOT NULL,
      sector_name TEXT NOT NULL,
      dominant_class TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

function normalizeClassName(className) {
  const map = {
    knight: "Knight",
    cavaleiro: "Knight",
    mage: "Mage",
    mago: "Mage",
    hunter: "Hunter",
    cacador: "Hunter",
    caçador: "Hunter"
  };

  return map[String(className || "").trim().toLowerCase()] || null;
}

async function dominateSector({ sectorId, className }) {
  const db = await initDB();

  const normalizedClass = normalizeClassName(className);

  if (!normalizedClass || !VALID_CLASSES.includes(normalizedClass)) {
    throw new Error("invalid class name");
  }

  const sectorResult = db.exec(
    `SELECT id, sector_name
     FROM world_sectors
     WHERE id = ?;`,
    [Number(sectorId)]
  );

  if (!sectorResult.length || !sectorResult[0].values.length) {
    throw new Error("sector not found");
  }

  const row = sectorResult[0].values[0];
  const safeSectorId = Number(row[0]);
  const sectorName = row[1];

  const existing = db.exec(
    `SELECT sector_id
     FROM sector_domination
     WHERE sector_id = ?;`,
    [safeSectorId]
  );

  if (existing.length && existing[0].values.length) {
    db.run(
      `UPDATE sector_domination
       SET dominant_class = ?,
           gold_bonus_percent = ?,
           drop_bonus_percent = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE sector_id = ?;`,
      [
        normalizedClass,
        DOMINATION_GOLD_BONUS,
        DOMINATION_DROP_BONUS,
        safeSectorId
      ]
    );
  } else {
    db.run(
      `INSERT INTO sector_domination (
        sector_id,
        dominant_class,
        gold_bonus_percent,
        drop_bonus_percent
      ) VALUES (?, ?, ?, ?);`,
      [
        safeSectorId,
        normalizedClass,
        DOMINATION_GOLD_BONUS,
        DOMINATION_DROP_BONUS
      ]
    );
  }

  const message =
    `⚔ ${normalizedClass} now dominates ${sectorName} and gains ` +
    `+${DOMINATION_GOLD_BONUS}% gold / +${DOMINATION_DROP_BONUS}% drop`;

  db.run(
    `INSERT INTO domination_logs (
      sector_id,
      sector_name,
      dominant_class,
      message
    ) VALUES (?, ?, ?, ?);`,
    [safeSectorId, sectorName, normalizedClass, message]
  );

  saveDB();

  await createEvent({
    eventType: "sector_domination",
    title: "Sector Domination Updated",
    message,
    metadata: {
      sector_id: safeSectorId,
      sector_name: sectorName,
      dominant_class: normalizedClass,
      gold_bonus_percent: DOMINATION_GOLD_BONUS,
      drop_bonus_percent: DOMINATION_DROP_BONUS
    }
  });

  return {
    sector_id: safeSectorId,
    sector_name: sectorName,
    dominant_class: normalizedClass,
    gold_bonus_percent: DOMINATION_GOLD_BONUS,
    drop_bonus_percent: DOMINATION_DROP_BONUS,
    message
  };
}

async function getSectorDomination(sectorId) {
  const db = await initDB();

  const sectorResult = db.exec(
    `SELECT id, sector_name
     FROM world_sectors
     WHERE id = ?;`,
    [Number(sectorId)]
  );

  if (!sectorResult.length || !sectorResult[0].values.length) {
    throw new Error("sector not found");
  }

  const sectorRow = sectorResult[0].values[0];

  const result = db.exec(
    `SELECT dominant_class, gold_bonus_percent, drop_bonus_percent, updated_at
     FROM sector_domination
     WHERE sector_id = ?;`,
    [Number(sectorId)]
  );

  if (!result.length || !result[0].values.length) {
    return {
      sector_id: Number(sectorRow[0]),
      sector_name: sectorRow[1],
      dominant_class: null,
      gold_bonus_percent: 0,
      drop_bonus_percent: 0,
      updated_at: null
    };
  }

  const row = result[0].values[0];

  return {
    sector_id: Number(sectorRow[0]),
    sector_name: sectorRow[1],
    dominant_class: row[0],
    gold_bonus_percent: row[1],
    drop_bonus_percent: row[2],
    updated_at: row[3]
  };
}

async function getAllDominations() {
  const db = await initDB();

  const result = db.exec(`
    SELECT ws.id,
           ws.sector_name,
           sd.dominant_class,
           sd.gold_bonus_percent,
           sd.drop_bonus_percent,
           sd.updated_at
    FROM world_sectors ws
    LEFT JOIN sector_domination sd ON sd.sector_id = ws.id
    ORDER BY ws.id ASC;
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    sector_id: row[0],
    sector_name: row[1],
    dominant_class: row[2],
    gold_bonus_percent: row[3] || 0,
    drop_bonus_percent: row[4] || 0,
    updated_at: row[5]
  }));
}

async function getDominationLogs() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id, sector_id, sector_name, dominant_class, message, created_at
    FROM domination_logs
    ORDER BY id DESC
    LIMIT 20;
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    sector_id: row[1],
    sector_name: row[2],
    dominant_class: row[3],
    message: row[4],
    created_at: row[5]
  }));
}

async function getSectorDominationBonus(sectorId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT dominant_class, gold_bonus_percent, drop_bonus_percent
     FROM sector_domination
     WHERE sector_id = ?;`,
    [Number(sectorId)]
  );

  if (!result.length || !result[0].values.length) {
    return {
      dominant_class: null,
      gold_bonus_percent: 0,
      drop_bonus_percent: 0
    };
  }

  const row = result[0].values[0];

  return {
    dominant_class: row[0],
    gold_bonus_percent: Number(row[1] || 0),
    drop_bonus_percent: Number(row[2] || 0)
  };
}

module.exports = {
  ensureDominationTables,
  dominateSector,
  getSectorDomination,
  getAllDominations,
  getDominationLogs,
  getSectorDominationBonus
};
