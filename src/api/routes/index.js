const express = require("express");

const realtimeRoutes = require("./realtime.routes");

const router = express.Router();

router.use("/realtime", realtimeRoutes);

module.exports = router;
