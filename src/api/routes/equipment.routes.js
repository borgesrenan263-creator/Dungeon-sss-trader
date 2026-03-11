const express = require("express");
const {
  getPlayerByName
} = require("../state/game.state");
const {
  equipItem,
  unequipItem,
  refineItem,
  getFinalStats
} = require("../../engine/equipment_engine");

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
    equipment: {
      equipped: player.equipped,
      inventory: player.inventory,
      stats: getFinalStats(player),
      gold: player.gold
    }
  });
});

router.post("/equip", (req, res) => {
  const { playerName, itemId } = req.body || {};
  const player = getPlayerByName(playerName);

  if (!player) {
    return res.status(404).json({
      ok: false,
      error: "player_not_found"
    });
  }

  const result = equipItem(player, itemId);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.status(200).json({
    ok: true,
    result,
    stats: getFinalStats(player)
  });
});

router.post("/unequip", (req, res) => {
  const { playerName, slot } = req.body || {};
  const player = getPlayerByName(playerName);

  if (!player) {
    return res.status(404).json({
      ok: false,
      error: "player_not_found"
    });
  }

  const result = unequipItem(player, slot);

  if (!result.ok) {
    return res.status(400).json(result);
  }

  return res.status(200).json({
    ok: true,
    result,
    stats: getFinalStats(player)
  });
});

router.post("/refine", (req, res) => {
  const { playerName, slot } = req.body || {};
  const player = getPlayerByName(playerName);

  if (!player) {
    return res.status(404).json({
      ok: false,
      error: "player_not_found"
    });
  }

  const result = refineItem(player, slot);

  if (!result.ok && !result.failed) {
    return res.status(400).json(result);
  }

  return res.status(200).json({
    ok: true,
    result,
    stats: getFinalStats(player),
    gold: player.gold
  });
});

module.exports = router;
