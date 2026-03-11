const express = require("express");
const router = express.Router();

const { requireBodyFields } = require("../../middlewares/validate.middleware");
const { ok, fail } = require("../../utils/api.response");
const {
  getPlayerByName,
  addItemToInventory,
  addDropToInventory,
  equipItem,
  refineItem,
  getEquipmentState
} = require("../../engine/equipment_engine");

router.post("/equip", requireBodyFields(["playerName", "itemId"]), (req, res) => {
  const { playerName, itemId } = req.body;
  const player = getPlayerByName(playerName);

  if (!player) {
    return fail(res, "player_not_found", 404);
  }

  const result = equipItem(player, itemId);

  if (!result?.ok) {
    return fail(res, result?.error || "equip_failed", 400);
  }

  return ok(res, result);
});

router.get("/:name", (req, res) => {
  const equipment = getEquipmentState(req.params.name);

  return ok(res, { equipment });
});

router.post("/refine", requireBodyFields(["playerName", "slot"]), (req, res) => {
  const { playerName, slot } = req.body;
  const player = getPlayerByName(playerName);

  if (!player) {
    return fail(res, "player_not_found", 404);
  }

  const result = refineItem(player, slot);

  if (!result?.ok) {
    return fail(res, result?.error || "refine_failed", 400);
  }

  return ok(res, result);
});

module.exports = router;
