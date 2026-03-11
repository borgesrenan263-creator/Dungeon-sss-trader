const express = require("express");

const playerRoutes = require("./player.routes");
const worldRoutes = require("./world.routes");
const galaxyRoutes = require("./galaxy.routes");
const worldmapRoutes = require("./worldmap.routes");
const marketRoutes = require("./market.routes");
const equipmentRoutes = require("./equipment.routes");

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
router.use("/galaxy", galaxyRoutes);
router.use("/worldmap", worldmapRoutes);
router.use("/market", marketRoutes);
router.use("/equipment", equipmentRoutes);

module.exports = router;
