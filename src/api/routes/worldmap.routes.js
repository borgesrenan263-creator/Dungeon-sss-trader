const express = require("express");

const router = express.Router();

router.get("/world", (req, res) => {
  res.json({
    ok: true,
    world: {
      name: "Dungeon SSS World",
      sectors: 10,
      maxLevel: 500
    }
  });
});

router.get("/links", (req, res) => {
  res.json({
    ok: true,
    links: [
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
      { from: 4, to: 5 }
    ]
  });
});

router.get("/events", (req, res) => {
  res.json({
    ok: true,
    events: [
      "Invasão de monstros",
      "Bonus de XP global",
      "Tempestade arcana",
      "Galaxy Boss apareceu"
    ]
  });
});

module.exports = router;
