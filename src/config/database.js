const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

let dbInstance = null;

async function initDB() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs({});
  const dbPath = path.join(process.cwd(), "database", "game.db");

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  return dbInstance;
}

function saveDB() {
  if (!dbInstance) return;

  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(path.join(process.cwd(), "database", "game.db"), buffer);
}

module.exports = {
  initDB,
  saveDB
};
