const express = require("express");
const router = express.Router();

const {
  getRecentGameEvents,
  getEventStats
} = require("../../realtime/game.events");

router.get("/events", (req, res) => {
  const limit = Number(req.query.limit || 30);

  return res.status(200).json({
    ok: true,
    events: getRecentGameEvents(
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 30
    )
  });
});

router.get("/events/stats", (req, res) => {
  return res.status(200).json({
    ok: true,
    stats: getEventStats()
  });
});

module.exports = router;
