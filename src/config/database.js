const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const dbFile = path.join(__dirname, "../../database.sqlite");

let db = null;

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbFile)) {
    const fileBuffer = fs.readFileSync(dbFile);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  return db;
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbFile, buffer);
}

function getDB() {
  return db;
}

module.exports = {
  initDB,
  getDB,
  saveDB
};
