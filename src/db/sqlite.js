const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const DB_FILE = path.join(process.cwd(), "data", "dungeon_sss_trader.sqlite");

let SQL = null;
let db = null;

async function initDb() {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (!db) {
    if (fs.existsSync(DB_FILE)) {
      const filebuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(filebuffer);
    } else {
      db = new SQL.Database();
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        data_json TEXT
      );
    `);
  }
}

function saveFile() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

function run(sql, params = []) {
  db.run(sql, params);
  saveFile();
  return { ok: true };
}

function get(sql, params = []) {
  const stmt = db.prepare(sql, params);

  if (stmt.step()) {
    return stmt.getAsObject();
  }

  return null;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql, params);

  const rows = [];

  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }

  return rows;
}

module.exports = {
  initDb,
  run,
  get,
  all
};
