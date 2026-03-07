const express = require("express");
const router = express.Router();

const {
  CRYSTAL_TABLE,
  getMonsters,
  killMonster,
  getCombatLogs,
  getCrystalDrops
} = require("../../repositories/combat.repository");

router.get("/monsters", async (req, res) => {
  try {
    const monsters = await getMonsters();

    return res.json({
      ok: true,
      total: monsters.length,
      monsters
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/crystals/table", async (req, res) => {
  try {
    return res.json({
      ok: true,
      total: CRYSTAL_TABLE.length,
      crystals: CRYSTAL_TABLE
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/kill", async (req, res) => {
  try {
    const { playerId, monsterId } = req.body;
    const result = await killMonster({ playerId, monsterId });

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
    const logs = await getCombatLogs(req.params.playerId);

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

router.get("/crystals/:playerId", async (req, res) => {
  try {
    const drops = await getCrystalDrops(req.params.playerId);

    return res.json({
      ok: true,
      total: drops.length,
      drops
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
