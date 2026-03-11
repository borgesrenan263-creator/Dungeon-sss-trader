const express = require("express");
const { state } = require("../state/game.state");
const { getWorldState } = require("../../engine/world_loop_engine");
const { getWorldAnalytics } = require("../../engine/analytics_engine");

const router = express.Router();

router.get("/world", (req, res) => {
  return res.status(200).json({
    ok: true,
    analytics: getWorldAnalytics(getWorldState(), state)
  });
});

module.exports = router;
