const express = require("express");
const router = express.Router();

const {
  getTopPlayers,
  getPlayerRank,
  recalculateGodRanking,
  getGodPlayers,
  announceGodLogin,
  getGlobalAlerts
} = require("../../repositories/ranking.repository");

router.get("/top10", async (req, res) => {
  try {
    const ranking = await getTopPlayers();

    return res.json({
      ok: true,
      total: ranking.length,
      ranking
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/player/:id", async (req, res) => {
  try {
    const playerRank = await getPlayerRank(req.params.id);

    return res.json({
      ok: true,
      rank: playerRank
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/recalculate", async (req, res) => {
  try {
    const ranking = await recalculateGodRanking();

    return res.json({
      ok: true,
      total: ranking.length,
      ranking
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/gods", async (req, res) => {
  try {
    const gods = await getGodPlayers();

    return res.json({
      ok: true,
      total: gods.length,
      gods
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/announce-login", async (req, res) => {
  try {
    const { playerId } = req.body;

    const result = await announceGodLogin(playerId);

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

router.get("/alerts", async (req, res) => {
  try {
    const alerts = await getGlobalAlerts();

    return res.json({
      ok: true,
      total: alerts.length,
      alerts
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
