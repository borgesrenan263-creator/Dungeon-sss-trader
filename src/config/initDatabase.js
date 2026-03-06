const fs = require("fs");
const path = require("path");
const { initDB, saveDB } = require("./database");

async function initializeSchema() {
  const db = await initDB();

  const schemaPath = path.join(__dirname, "../../database/schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  db.run(schema);

  saveDB();

  console.log("Game database schema loaded");
}

module.exports = initializeSchema;
