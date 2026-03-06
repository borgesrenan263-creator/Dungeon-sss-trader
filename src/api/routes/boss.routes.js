const express = require("express");
const router = express.Router();

const {
  spawnBoss,
  joinBoss,
  killBossLayer
} = require("../../repositories/boss.repository");

router.post("/spawn", async (req, res) => {

  try {

    const result = await spawnBoss();

    res.json({ ok: true, result });

  } catch (error) {

    res.status(400).json({ ok: false, error: error.message });

  }

});

router.post("/join", async (req, res) => {

  try {

    const { playerId } = req.body;

    const result = await joinBoss(playerId);

    res.json({ ok: true, result });

  } catch (error) {

    res.status(400).json({ ok: false, error: error.message });

  }

});

router.post("/attack", async (req, res) => {

  try {

    const result = await killBossLayer();

    res.json({ ok: true, result });

  } catch (error) {

    res.status(400).json({ ok: false, error: error.message });

  }

});

module.exports = router;
