const express = require("express");
const {
  createPlayerProfile,
  getPlayerProfile,
  movePlayerSector
} = require("../state/game.state");

const router = express.Router();

router.post("/create", (req, res) => {
  const created = createPlayerProfile(req.body || {});

  return res.status(200).json({
    ok: true,
    player: created.player,
    sector: created.sector
  });
});

router.get("/:name", (req, res) => {
  const profile = getPlayerProfile(req.params.name);

  if (!profile) {
    return res.status(404).json({
      ok: false,
      error: "player_not_found"
    });
  }

  return res.status(200).json({
    ok: true,
    profile
  });
});

router.post("/:name/move-sector", (req, res) => {
  const sector = Number(req.body?.sector || 1);
  const moved = movePlayerSector(req.params.name, sector);

  if (!moved.ok) {
    return res.status(404).json(moved);
  }

  return res.status(200).json({
    ok: true,
    moved
  });
});

module.exports = router;
