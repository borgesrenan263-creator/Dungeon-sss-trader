const express = require("express");
const router = express.Router();

const {
  getStorageStatus,
  unlockStorageTab,
  depositItem,
  withdrawItem,
  getStorageContents
} = require("../../repositories/storage.repository");

router.get("/status/:playerId", async (req, res) => {
  try {
    const status = await getStorageStatus(req.params.playerId);

    return res.json({
      ok: true,
      status
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/unlock", async (req, res) => {
  try {
    const { playerId, tabNumber } = req.body;

    const result = await unlockStorageTab({ playerId, tabNumber });

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

router.post("/deposit", async (req, res) => {
  try {
    const { playerId, inventoryId, tabNumber, slotNumber } = req.body;

    const result = await depositItem({
      playerId,
      inventoryId,
      tabNumber,
      slotNumber
    });

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

router.post("/withdraw", async (req, res) => {
  try {
    const { playerId, storageId } = req.body;

    const result = await withdrawItem({
      playerId,
      storageId
    });

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

router.get("/:playerId", async (req, res) => {
  try {
    const storage = await getStorageContents(req.params.playerId);

    return res.json({
      ok: true,
      storage
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
