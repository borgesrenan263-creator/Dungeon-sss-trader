require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { initDB } = require("./config/database");
const { ensurePlayersTables } = require("./repositories/players.repository");
const { ensureCombatTables, seedMonsters } = require("./repositories/combat.repository");
const { ensureItemsTables, seedItems } = require("./repositories/items.repository");
const { ensureForgeTables } = require("./repositories/forge.repository");
const { ensureBossTables } = require("./repositories/boss.repository");
const { ensureMarketTables } = require("./repositories/market.repository");
const { ensureObsidianTables, seedObsidianSystem } = require("./repositories/obsidian.repository");
const { ensurePetsTables } = require("./repositories/pets.repository");

const playersRoutes = require("./api/routes/players.routes");
const combatRoutes = require("./api/routes/combat.routes");
const itemsRoutes = require("./api/routes/items.routes");
const forgeRoutes = require("./api/routes/forge.routes");
const rankingRoutes = require("./api/routes/ranking.routes");
const bossRoutes = require("./api/routes/boss.routes");
const marketRoutes = require("./api/routes/market.routes");
const obsidianRoutes = require("./api/routes/obsidian.routes");
const petsRoutes = require("./api/routes/pets.routes");

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json());

let db;

app.use("/players", playersRoutes);
app.use("/combat", combatRoutes);
app.use("/items", itemsRoutes);
app.use("/forge", forgeRoutes);
app.use("/ranking", rankingRoutes);
app.use("/boss", bossRoutes);
app.use("/market", marketRoutes);
app.use("/obsidian", obsidianRoutes);
app.use("/pets", petsRoutes);

async function startServer() {
  try {
    db = await initDB();
    console.log("Database initialized");

    await ensurePlayersTables();
    await ensureCombatTables();
    await ensureItemsTables();
    await ensureForgeTables();
    await ensureBossTables();
    await ensureMarketTables();
    await ensureObsidianTables();
    await ensurePetsTables();

    await seedMonsters();
    await seedItems();
    await seedObsidianSystem();

    console.log("Game systems loaded");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
