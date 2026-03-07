const express = require("express");
const router = express.Router();

const {
  getCharacterStats,
  gainCharacterXp,
  allocateStats
} = require("../../repositories/character.repository");

router.get("/stats/:playerId", async (req, res) => {
  try {
    const result = await getCharacterStats(req.params.playerId);

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

router.post("/gain-xp", async (req, res) => {
  try {
    const { playerId, xpAmount } = req.body;

    const result = await gainCharacterXp({
      playerId,
      xpAmount
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

router.post("/allocate", async (req, res) => {
  try {
    const { playerId, strength, dexterity, intelligence, vitality } = req.body;

    const result = await allocateStats({
      playerId,
      strength,
      dexterity,
      intelligence,
      vitality
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
