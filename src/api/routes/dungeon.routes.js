const express = require("express");
const router = express.Router();

const {
  listDungeons,
  enterDungeon,
  getDungeonStatus,
  progressDungeon,
  getDungeonLoot,
  exitDungeon
} = require("../../repositories/dungeon.repository");

router.get("/list", async (req, res) => {
  try {
    const dungeons = await listDungeons();

    res.json({
      ok: true,
      total: dungeons.length,
      dungeons
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/enter", async (req, res) => {
  try {
    const { playerId, dungeonId } = req.body;

    const result = await enterDungeon({
      playerId,
      dungeonId
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
    const result = await getDungeonStatus(req.params.playerId);

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

router.post("/progress", async (req, res) => {
  try {
    const { playerId } = req.body;

    const result = await progressDungeon({
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

router.get("/loot/:playerId", async (req, res) => {
  try {
    const loot = await getDungeonLoot(req.params.playerId);

    res.json({
      ok: true,
      total: loot.length,
      loot
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/exit", async (req, res) => {
  try {
    const { playerId } = req.body;

    const result = await exitDungeon({
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

module.exports = router;
