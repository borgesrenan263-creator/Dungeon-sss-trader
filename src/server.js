require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mapRoutes = require("./api/routes/map.routes");
const exchangeGoldRoutes = require("./api/routes/exchange_gold.routes");

const { initDB } = require("./config/database");
const { ensurePlayersTables } = require("./repositories/players.repository");
const { ensureCombatTables, seedMonsters } = require("./repositories/combat.repository");
const { ensureItemsTables, seedItems } = require("./repositories/items.repository");
const { ensureRankingTables } = require("./repositories/ranking.repository");
const { ensureBossTables } = require("./repositories/boss.repository");
const { ensureMarketTables } = require("./repositories/market.repository");
const { ensureObsidianTables, seedObsidianSystem } = require("./repositories/obsidian.repository");
const { ensurePetsTables } = require("./repositories/pets.repository");
const { ensureStorageTables } = require("./repositories/storage.repository");
const { ensureHubTables, seedHubZones } = require("./repositories/hub.repository");
const { ensureExchangeTables } = require("./repositories/exchange.repository");
const { ensureWorldTables, seedWorldSectors } = require("./repositories/world.repository");
const { ensureSpawnTables, seedSectorMonsters } = require("./repositories/spawn.repository");
const { ensureDominationTables } = require("./repositories/domination.repository");
const { ensureEventTables } = require("./repositories/events.repository");
const { ensureGuildTables } = require("./repositories/guild.repository");
const { ensureGuildWarTables } = require("./repositories/guildwar.repository");
const { ensureCrystalTables, seedCrystals } = require("./repositories/crystal.repository");
const { ensureGoldMarketTables } = require("./repositories/goldmarket.repository");

const playersRoutes = require("./api/routes/players.routes");
const combatRoutes = require("./api/routes/combat.routes");
const itemsRoutes = require("./api/routes/items.routes");
const forgeRoutes = require("./api/routes/forge.routes");
const rankingRoutes = require("./api/routes/ranking.routes");
const bossRoutes = require("./api/routes/boss.routes");
const marketRoutes = require("./api/routes/market.routes");
const obsidianRoutes = require("./api/routes/obsidian.routes");
const petsRoutes = require("./api/routes/pets.routes");
const storageRoutes = require("./api/routes/storage.routes");
const hubRoutes = require("./api/routes/hub.routes");
const exchangeRoutes = require("./api/routes/exchange.routes");
const worldRoutes = require("./api/routes/world.routes");
const spawnRoutes = require("./api/routes/spawn.routes");
const dominationRoutes = require("./api/routes/domination.routes");
const eventsRoutes = require("./api/routes/events.routes");
const guildRoutes = require("./api/routes/guild.routes");
const guildWarRoutes = require("./api/routes/guildwar.routes");
const galaxyRoutes = require("./api/routes/galaxy.routes");
const crystalRoutes = require("./api/routes/crystal.routes");
const goldMarketRoutes = require("./api/routes/goldmarket.routes");

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json());
app.use("/map", mapRoutes);
app.use("/exchange-gold", exchangeGoldRoutes);

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
app.use("/storage", storageRoutes);
app.use("/hub", hubRoutes);
app.use("/exchange", exchangeRoutes);
app.use("/world", worldRoutes);
app.use("/spawn", spawnRoutes);
app.use("/domination", dominationRoutes);
app.use("/events", eventsRoutes);
app.use("/guild", guildRoutes);
app.use("/guildwar", guildWarRoutes);
app.use("/galaxy", galaxyRoutes);
app.use("/crystal", crystalRoutes);
app.use("/goldmarket", goldMarketRoutes);

async function startServer() {
  try {
    db = await initDB();
    console.log("Database initialized");

    await ensurePlayersTables();
    await ensureCombatTables();
    await ensureItemsTables();
    await ensureRankingTables();
    await ensureBossTables();
    await ensureMarketTables();
    await ensureObsidianTables();
    await ensurePetsTables();
    await ensureStorageTables();
    await ensureHubTables();
    await ensureExchangeTables();
    await ensureWorldTables();
    await ensureSpawnTables();
    await ensureDominationTables();
    await ensureEventTables();
    await ensureGuildTables();
    await ensureGuildWarTables();
    await ensureCrystalTables();
    await ensureGoldMarketTables();

    await seedMonsters();
    await seedItems();
    await seedObsidianSystem();
    await seedHubZones();
    await seedWorldSectors();
    await seedSectorMonsters();
    await seedCrystals();

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
