const express = require("express");
const router = express.Router();

const {
  getHubOverview,
  getHubZones,
  openPlayerStall,
  closePlayerStall,
  getActiveStalls
} = require("../../repositories/hub.repository");

router.get("/", async (req, res) => {
  try {
    const hub = await getHubOverview();

    return res.json({
      ok: true,
      hub
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/zones", async (req, res) => {
  try {
    const zones = await getHubZones();

    return res.json({
      ok: true,
      total: zones.length,
      zones
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/stalls", async (req, res) => {
  try {
    const stalls = await getActiveStalls();

    return res.json({
      ok: true,
      total: stalls.length,
      stalls
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/stalls/open", async (req, res) => {
  try {
    const { playerId, stallName } = req.body;

    const result = await openPlayerStall({ playerId, stallName });

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

router.post("/stalls/close", async (req, res) => {
  try {
    const { playerId } = req.body;

    const result = await closePlayerStall(playerId);

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

module.exports = router;
