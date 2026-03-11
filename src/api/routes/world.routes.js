const express = require("express");
const {
  getWorld,
  getSectors,
  getSectorById,
  advanceWorldTick
} = require("../../engine/world_map_engine");

const router = express.Router();

function buildWorldPayload() {
  return {
    tick: getWorld().tick,
    world_sectors: getSectors(),
    recent_spawns: getWorld().recentSpawns || []
  };
}

router.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    world: buildWorldPayload()
  });
});

router.get("/state", (req, res) => {
  return res.status(200).json({
    ok: true,
    world: buildWorldPayload()
  });
});

router.get("/sectors", (req, res) => {
  return res.status(200).json({
    ok: true,
    sectors: getSectors()
  });
});

router.get("/sector/:id", (req, res) => {
  const sector = getSectorById(req.params.id);

  if (!sector) {
    return res.status(404).json({
      ok: false,
      error: "sector_not_found"
    });
  }

  return res.status(200).json({
    ok: true,
    sector
  });
});

router.post("/tick", (req, res) => {
  const result = advanceWorldTick();

  return res.status(200).json({
    ok: true,
    result
  });
});

module.exports = router;
