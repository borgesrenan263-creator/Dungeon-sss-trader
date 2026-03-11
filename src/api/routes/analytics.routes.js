const express = require("express");
const router = express.Router();

const { getAllPlayers } = require("../state/game.state");

router.get("/world", (req, res) => {
  const players = getAllPlayers();

  return res.status(200).json({
    ok: true,
    analytics: {
      ticks: 1,
      spawnRate: 1,
      totalPlayers: players.length,
      onlinePlayers: players.filter((p) => p.isOnline).length
    }
  });
});

module.exports = router;
