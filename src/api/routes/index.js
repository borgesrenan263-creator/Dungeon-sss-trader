const express = require("express");

const healthRoutes = require("./health.routes");
const realtimeRoutes = require("./realtime.routes");

const router = express.Router();

router.use("/", healthRoutes);
router.use("/realtime", realtimeRoutes);

module.exports = router;
