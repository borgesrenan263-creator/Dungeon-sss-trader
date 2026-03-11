const express = require("express");
const { getPlayerByName, getPlayerDrops } = require("../state/game.state");
const { getFinalStats } = require("../../engine/equipment_engine");

const router = express.Router();

router.get("/:name", (req, res) => {
  const player = getPlayerByName(req.params.name);

  if (!player) {
    return res.status(404).json({
      ok: false,
      error: "player_not_found"
    });
  }

  return res.status(200).json({
    ok: true,
    inventory: {
      owner: player.name,
      gold: player.gold,
      materials: player.inventory.materials,
      equipments: player.inventory.equipments,
      equipped: player.equipped,
      stats: getFinalStats(player)
    }
  });
});

router.get("/:name/drops", (req, res) => {
  const drops = getPlayerDrops(req.params.name);

  if (!drops) {
    return res.status(404).json({
      ok: false,
      error: "player_not_found"
    });
  }

  return res.status(200).json({
    ok: true,
    drops
  });
});

module.exports = router;
