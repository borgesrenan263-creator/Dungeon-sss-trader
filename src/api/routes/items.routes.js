const express = require("express");
const router = express.Router();

const {
  getAllItems,
  giveItemToPlayer,
  getPlayerInventory
} = require("../../repositories/items.repository");

router.get("/", async (req, res) => {
  try {
    const items = await getAllItems();

    return res.json({
      ok: true,
      total: items.length,
      items
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/give", async (req, res) => {
  try {
    const { playerId, itemId } = req.body;

    const result = await giveItemToPlayer({ playerId, itemId });

    return res.json({
      ok: true,
      result
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/inventory/:playerId", async (req, res) => {
  try {
    const inventory = await getPlayerInventory(req.params.playerId);

    return res.json({
      ok: true,
      total: inventory.length,
      inventory
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
