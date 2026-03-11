const express = require("express");
const { getRealtimeStats } = require("../../realtime/live_hub");

const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    realtime: getRealtimeStats()
  });
});

module.exports = router;
