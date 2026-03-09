const express = require("express");
const router = express.Router();

const {
  joinArenaQueue,
  startArenaMatch,
  attackArena,
  getArenaStatus,
  getArenaHistory,
  getArenaRanking
} = require("../../repositories/arena.repository");

router.post("/queue", async (req, res) => {
  try {
    const { playerId } = req.body;

    const result = await joinArenaQueue({
      playerId
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

router.post("/match/start", async (req, res) => {
  try {
    const result = await startArenaMatch();

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

router.post("/attack", async (req, res) => {
  try {
    const { attackerPlayerId } = req.body;

    const result = await attackArena({
      attackerPlayerId
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

router.get("/status/:playerId", async (req, res) => {
  try {
    const result = await getArenaStatus(req.params.playerId);

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

router.get("/history/:playerId", async (req, res) => {
  try {
    const history = await getArenaHistory(req.params.playerId);

    res.json({
      ok: true,
      total: history.length,
      history
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/ranking", async (req, res) => {
  try {
    const ranking = await getArenaRanking();

    res.json({
      ok: true,
      total: ranking.length,
      ranking
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
