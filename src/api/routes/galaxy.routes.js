const express = require("express");
const router = express.Router();

const {
  spawnBoss,
  getActiveBoss,
  joinBoss,
  getBossParticipants,
  damageBossLayer,
  getBossRewards,
  getAscensionStatus
} = require("../../repositories/boss.repository");

router.post("/spawn", async (req, res) => {
  try {
    const result = await spawnBoss();
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

router.get("/active", async (req, res) => {
  try {
    const boss = await getActiveBoss();

    return res.json({
      ok: true,
      boss
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/join", async (req, res) => {
  try {
    const { playerId } = req.body;

    const result = await joinBoss(playerId);

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

router.get("/participants", async (req, res) => {
  try {
    const participants = await getBossParticipants();

    return res.json({
      ok: true,
      total: participants.length,
      participants
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/attack", async (req, res) => {
  try {
    const result = await damageBossLayer();

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

router.get("/rewards", async (req, res) => {
  try {
    const rewards = await getBossRewards();

    return res.json({
      ok: true,
      total: rewards.length,
      rewards
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/ascension/:playerId", async (req, res) => {
  try {
    const ascension = await getAscensionStatus(req.params.playerId);

    return res.json({
      ok: true,
      ascension
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
