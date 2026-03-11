const express = require("express");
const { state } = require("../state/game.state");
const { getTopByGold, getTopByPvp } = require("../../engine/leaderboard_engine");

const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    leaderboard: {
      gold: getTopByGold(state.players),
      pvp: getTopByPvp(state.players)
    }
  });
});

module.exports = router;
