const express = require("express");
const router = express.Router();

const {
  startPartyDungeon,
  progressPartyDungeon,
  getPartyDungeonStatus,
  getPartyLoot,
  partyRaidAttack
} = require("../../repositories/party_coop.repository");

router.post("/dungeon/start", async (req, res) => {
  try {
    const { partyId, dungeonId, actorPlayerId } = req.body;

    const result = await startPartyDungeon({
      partyId,
      dungeonId,
      actorPlayerId
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

router.post("/dungeon/progress", async (req, res) => {
  try {
    const { partyId, actorPlayerId } = req.body;

    const result = await progressPartyDungeon({
      partyId,
      actorPlayerId
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

router.get("/dungeon/status/:partyId", async (req, res) => {
  try {
    const result = await getPartyDungeonStatus(req.params.partyId);

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

router.get("/loot/:partyId", async (req, res) => {
  try {
    const loot = await getPartyLoot(req.params.partyId);

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

router.post("/raid/attack", async (req, res) => {
  try {
    const { partyId, actorPlayerId, skillUsed } = req.body;

    const result = await partyRaidAttack({
      partyId,
      actorPlayerId,
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

module.exports = router;
