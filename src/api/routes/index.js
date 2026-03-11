const express = require("express");

const realtimeRoutes = require("./realtime.routes");
const playerRoutes = require("./player.routes");

const router = express.Router();

router.use("/realtime", realtimeRoutes);
router.use("/players", playerRoutes);

module.exports = router;
