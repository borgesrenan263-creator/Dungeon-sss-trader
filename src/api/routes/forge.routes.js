const express = require("express");
const router = express.Router();

const {
  buyStabilityStone,
  getForgeSupport,
  upgradeItem,
  getForgeLogs
} = require("../../repositories/forge.repository");

router.post("/stability-stone/buy", async (req, res) => {
  try {
    const { playerId } = req.body;

    const result = await buyStabilityStone(playerId);

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

router.get("/support/:playerId", async (req, res) => {
  try {
    const support = await getForgeSupport(req.params.playerId);

    return res.json({
      ok: true,
      support
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/upgrade", async (req, res) => {
  try {
    const { inventoryId, useStabilityStone } = req.body;

    const result = await upgradeItem(
      inventoryId,
      Boolean(useStabilityStone)
    );

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

router.get("/logs/:playerId", async (req, res) => {
  try {
    const logs = await getForgeLogs(req.params.playerId);

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
