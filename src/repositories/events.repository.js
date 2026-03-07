const { initDB, saveDB } = require("../config/database");

async function ensureEventTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS global_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function createEvent({ eventType, title, message, metadata = null }) {
  const db = await initDB();

  const safeEventType = String(eventType || "").trim();
  const safeTitle = String(title || "").trim();
  const safeMessage = String(message || "").trim();

  if (!safeEventType) throw new Error("event type is required");
  if (!safeTitle) throw new Error("title is required");
  if (!safeMessage) throw new Error("message is required");

  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  db.run(
    `INSERT INTO global_events (
      event_type,
      title,
      message,
      metadata_json
    ) VALUES (?, ?, ?, ?);`,
    [safeEventType, safeTitle, safeMessage, metadataJson]
  );

  saveDB();

  const inserted = db.exec(`
    SELECT id, event_type, title, message, metadata_json, created_at
    FROM global_events
    ORDER BY id DESC
    LIMIT 1;
  `);

  const row = inserted[0].values[0];

  return {
    id: row[0],
    event_type: row[1],
    title: row[2],
    message: row[3],
    metadata: row[4] ? JSON.parse(row[4]) : null,
    created_at: row[5]
  };
}

async function getEventFeed(limit = 20) {
  const db = await initDB();

  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));

  const result = db.exec(
    `SELECT id, event_type, title, message, metadata_json, created_at
     FROM global_events
     ORDER BY id DESC
     LIMIT ?;`,
    [safeLimit]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    event_type: row[1],
    title: row[2],
    message: row[3],
    metadata: row[4] ? JSON.parse(row[4]) : null,
    created_at: row[5]
  }));
}

async function broadcastSystemEvent({ title, message }) {
  return createEvent({
    eventType: "system_broadcast",
    title,
    message,
    metadata: null
  });
}

module.exports = {
  ensureEventTables,
  createEvent,
  getEventFeed,
  broadcastSystemEvent
};
