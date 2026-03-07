const express = require("express");
const router = express.Router();

const {
  spawnBoss,
  joinBoss,
  attackBoss,
  getBossStatus,
  getBossRanking,
  getPlayerRewards,
  claimReward
} = require("../../repositories/raid.repository");

router.post("/spawn", async (req, res) => {
  try {
    const { bossName, maxHp, rewardName } = req.body;

    const result = await spawnBoss({
      bossName,
      maxHp,
      rewardName
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

router.post("/join", async (req, res) => {
  try {
    const { playerId } = req.body;

    const result = await joinBoss({
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

router.post("/attack", async (req, res) => {
  try {
    const { playerId, skillUsed } = req.body;

    const result = await attackBoss({
      playerId,
      skillUsed
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

router.get("/status", async (req, res) => {
  try {
    const result = await getBossStatus();

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

router.get("/ranking", async (req, res) => {
  try {
    const result = await getBossRanking();

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

router.get("/rewards/:playerId", async (req, res) => {
  try {
    const rewards = await getPlayerRewards(req.params.playerId);

    res.json({
      ok: true,
      total: rewards.length,
      rewards
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/claim", async (req, res) => {
  try {
    const { playerId, rewardId } = req.body;

    const result = await claimReward({
      playerId,
      rewardId
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

module.exports = router;
