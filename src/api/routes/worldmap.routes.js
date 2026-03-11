const express = require("express");
const {
  getWorld,
  getSectors
} = require("../../engine/world_map_engine");

const router = express.Router();

router.get("/world", (req, res) => {
  return res.status(200).json({
    ok: true,
    world: {
      tick: getWorld().tick,
      world_sectors: getSectors(),
      recent_spawns: getWorld().recentSpawns || []
    }
  });
});

router.get("/links", (req, res) => {
  const sectors = getSectors();

  const links = [];
  for (let i = 0; i < sectors.length - 1; i += 1) {
    links.push({
      from: sectors[i].id,
      to: sectors[i + 1].id
    });
  }

  return res.status(200).json({
    ok: true,
    links
  });
});

router.get("/events", (req, res) => {
  return res.status(200).json({
    ok: true,
    events: getWorld().recentSpawns || []
  });
});

module.exports = router;
