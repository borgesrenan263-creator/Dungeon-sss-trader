const express = require("express");
const { getApiWorldState } = require("../state/game.state");

const router = express.Router();

/*
WORLD ROOT
*/

router.get("/", (req, res) => {
  const sectors = [];

  for (let i = 1; i <= 10; i++) {
    sectors.push({
      id: i,
      levelMin: (i - 1) * 50 + 1,
      levelMax: i * 50,
      mobs: ["Slime", "Wolf", "Goblin", "Orc"]
    });
  }

  return res.status(200).json({
    ok: true,
    world: {
      name: "Dungeon SSS World",
      max_level: 500,
      world_sectors: sectors
    }
  });
});

/*
WORLD STATE
*/

router.get("/state", (req, res) => {
  return res.json({
    ok: true,
    world: getApiWorldState()
  });
});

/*
WORLD ECONOMY
*/

router.get("/economy", (req, res) => {
  const world = getApiWorldState();

  return res.json({
    ok: true,
    economy: world.economy
  });
});

/*
WORLD SECTORS
*/

router.get("/sectors", (req, res) => {
  const sectors = [];

  for (let i = 1; i <= 10; i++) {
    sectors.push({
      id: i,
      levelMin: (i - 1) * 50 + 1,
      levelMax: i * 50,
      mobs: ["Slime", "Wolf", "Goblin"]
    });
  }

  return res.status(200).json({
    ok: true,
    sectors
  });
});

/*
SINGLE SECTOR
*/

router.get("/sector/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!id || id < 1) {
    return res.status(400).json({
      ok: false,
      error: "invalid_sector"
    });
  }

  const sector = {
    id,
    levelMin: (id - 1) * 50 + 1,
    levelMax: id * 50,
    mobs: ["Slime", "Wolf", "Goblin", "Orc"]
  };

  return res.status(200).json({
    ok: true,
    sector
  });
});

module.exports = router;
