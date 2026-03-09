const express = require("express");
const router = express.Router();

const {
  getMonsterDropTable,
  getDungeonDropTable,
  getBossDropTable,
  rollMonsterDrop,
  rollDungeonDrop,
  rollBossDrop,
  getPlayerDropLog
} = require("../../repositories/drops.repository");

router.get("/monster/:monsterId", async (req, res) => {
  try {
    const result = await getMonsterDropTable(req.params.monsterId);

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

router.get("/dungeon/:dungeonId", async (req, res) => {
  try {
    const result = await getDungeonDropTable(req.params.dungeonId);

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

router.get("/boss/:bossId", async (req, res) => {
  try {
    const result = await getBossDropTable(req.params.bossId);

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

router.post("/roll/monster", async (req, res) => {
  try {
    const { playerId, monsterId, partyBonus } = req.body;

    const result = await rollMonsterDrop({
      playerId,
      monsterId,
      partyBonus
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

router.post("/roll/dungeon", async (req, res) => {
  try {
    const { playerId, dungeonId, partyBonus } = req.body;

    const result = await rollDungeonDrop({
      playerId,
      dungeonId,
      partyBonus
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

router.post("/roll/boss", async (req, res) => {
  try {
    const { playerId, bossId, bossBonus } = req.body;

    const result = await rollBossDrop({
      playerId,
      bossId,
      bossBonus
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

router.get("/log/:playerId", async (req, res) => {
  try {
    const log = await getPlayerDropLog(req.params.playerId);

    res.json({
      ok: true,
      total: log.length,
      log
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
