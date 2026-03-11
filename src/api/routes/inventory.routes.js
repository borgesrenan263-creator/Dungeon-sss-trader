const express = require("express");
const router = express.Router();

const { getPlayerByName } = require("../state/game.state");

router.get("/:name", (req, res) => {
  const player = getPlayerByName(req.params.name);

  return res.status(200).json({
    ok: true,
    inventory: {
      owner: player.name,
      equipments: player.inventory.equipments || [],
      materials: player.inventory.materials || [],
      consumables: player.inventory.consumables || [],
      drops: player.inventory.drops || []
    }
  });
});

router.get("/:name/drops", (req, res) => {
  const player = getPlayerByName(req.params.name);

  return res.status(200).json({
    ok: true,
    drops: player.inventory.drops || []
  });
});

module.exports = router;
