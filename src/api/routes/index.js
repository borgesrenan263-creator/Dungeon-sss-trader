const express = require("express");

const playerRoutes = require("./player.routes");
const worldRoutes = require("./world.routes");
const worldmapRoutes = require("./worldmap.routes");
const galaxyRoutes = require("./galaxy.routes");
const equipmentRoutes = require("./equipment.routes");
const marketRoutes = require("./market.routes");
const pvpRoutes = require("./pvp.routes");
const inventoryRoutes = require("./inventory.routes");
const dashboardRoutes = require("./dashboard.routes");
const leaderboardRoutes = require("./leaderboard.routes");
const analyticsRoutes = require("./analytics.routes");
const telemetryRoutes = require("./telemetry.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    name: "Dungeon SSS Trader API",
    status: "running"
  });
});

router.use("/player", playerRoutes);
router.use("/world", worldRoutes);
router.use("/worldmap", worldmapRoutes);
router.use("/galaxy", galaxyRoutes);
router.use("/equipment", equipmentRoutes);
router.use("/market", marketRoutes);
router.use("/pvp", pvpRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/telemetry", telemetryRoutes);

module.exports = router;
