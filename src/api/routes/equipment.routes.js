const express = require("express");
const router = express.Router();

const {
  getPlayerEquipment,
  equipItem,
  unequipItem,
  getEquipmentStats
} = require("../../repositories/equipment.repository");

router.get("/player/:playerId", async (req, res) => {
  try {
    const equipment = await getPlayerEquipment(req.params.playerId);

    res.json({
      ok: true,
      total: equipment.length,
      equipment
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/equip", async (req, res) => {
  try {
    const { playerId, inventoryId } = req.body;

    const result = await equipItem({
      playerId,
      inventoryId
    });

    res.json({
      ok: true,
      result
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/unequip", async (req, res) => {
  try {
    const { playerId, slotKey } = req.body;

    const result = await unequipItem({
      playerId,
      slotKey
    });

    res.json({
      ok: true,
      result
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/stats/:playerId", async (req, res) => {
  try {
    const result = await getEquipmentStats(req.params.playerId);

    res.json({
      ok: true,
      result
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
