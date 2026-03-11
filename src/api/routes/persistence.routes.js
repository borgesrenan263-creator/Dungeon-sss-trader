const express = require("express");
const router = express.Router();

const { getAllPlayers } = require("../state/game.state");

let snapshot = {
  players: []
};

router.post("/init", (req, res) => {
  snapshot = {
    players: []
  };

  return res.status(200).json({
    ok: true,
    initialized: true
  });
});

router.post("/save", (req, res) => {
  snapshot = {
    players: getAllPlayers().map((p) => ({
      name: p.name,
      nickname: p.nickname,
      gold: p.gold,
      hp: p.hp,
      maxHp: p.maxHp,
      sector: p.sector,
      level: p.level,
      xp: p.xp,
      xpToNextLevel: p.xpToNextLevel,
      isOnline: p.isOnline,
      inventory: p.inventory,
      equipped: p.equipped,
      pvp: p.pvp
    }))
  };

  return res.status(200).json({
    ok: true,
    saved: true,
    data: snapshot
  });
});

router.get("/load", (req, res) => {
  return res.status(200).json({
    ok: true,
    data: snapshot
  });
});

module.exports = router;
