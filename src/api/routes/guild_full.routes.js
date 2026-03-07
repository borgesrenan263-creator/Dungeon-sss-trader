const express = require("express");
const router = express.Router();

const {
  createGuildFull,
  joinGuildFull,
  promoteGuildMember,
  kickGuildMember,
  getGuildDetails,
  getGuildRanking,
  getGuildStorage,
  depositGuildGold,
  withdrawGuildGold
} = require("../../repositories/guild_full.repository");

router.post("/create-full", async (req, res) => {
  try {
    const { leaderPlayerId, guildName, guildTag } = req.body;

    const result = await createGuildFull({
      leaderPlayerId,
      guildName,
      guildTag
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post("/join-full", async (req, res) => {
  try {
    const { guildId, playerId } = req.body;

    const result = await joinGuildFull({
      guildId,
      playerId
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post("/promote", async (req, res) => {
  try {
    const { guildId, actorPlayerId, targetPlayerId, newRole } = req.body;

    const result = await promoteGuildMember({
      guildId,
      actorPlayerId,
      targetPlayerId,
      newRole
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post("/kick", async (req, res) => {
  try {
    const { guildId, actorPlayerId, targetPlayerId } = req.body;

    const result = await kickGuildMember({
      guildId,
      actorPlayerId,
      targetPlayerId
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.get("/details/:guildId", async (req, res) => {
  try {
    const result = await getGuildDetails(req.params.guildId);

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.get("/ranking", async (req, res) => {
  try {
    const ranking = await getGuildRanking();

    res.json({
      ok: true,
      total: ranking.length,
      ranking
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/storage/:guildId", async (req, res) => {
  try {
    const result = await getGuildStorage(req.params.guildId);

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post("/storage/deposit-gold", async (req, res) => {
  try {
    const { guildId, playerId, goldAmount } = req.body;

    const result = await depositGuildGold({
      guildId,
      playerId,
      goldAmount
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post("/storage/withdraw-gold", async (req, res) => {
  try {
    const { guildId, playerId, goldAmount } = req.body;

    const result = await withdrawGuildGold({
      guildId,
      playerId,
      goldAmount
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

module.exports = router;
