const express = require("express");
const router = express.Router();

const { getAllPlayers } = require("../state/game.state");

router.get("/", (req, res) => {
  const players = getAllPlayers();

  const gold = players
    .map((p) => ({
      name: p.name,
      gold: p.gold || 0
    }))
    .sort((a, b) => b.gold - a.gold);

  const pvp = players
    .map((p) => ({
      name: p.name,
      wins: p.pvp?.wins || 0,
      losses: p.pvp?.losses || 0
    }))
    .sort((a, b) => b.wins - a.wins);

  return res.status(200).json({
    ok: true,
    leaderboard: {
      gold,
      pvp
    }
  });
});

module.exports = router;
