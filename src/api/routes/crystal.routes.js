const express = require("express");
const router = express.Router();

const {
  getPlayerCrystals,
  getCrystalLogs
} = require("../../repositories/crystal.repository");

router.get("/player/:playerId", async (req, res) => {
  try {
    const crystals = await getPlayerCrystals(req.params.playerId);

    return res.json({
      ok: true,
      total: crystals.length,
      crystals
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/logs/:playerId", async (req, res) => {
  try {
    const logs = await getCrystalLogs(req.params.playerId);

    return res.json({
      ok: true,
      total: logs.length,
      logs
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
