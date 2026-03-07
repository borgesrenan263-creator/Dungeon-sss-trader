const express = require("express");
const router = express.Router();

const {
  createGuild,
  joinGuild,
  getGuildById,
  getGuildTreasury,
  depositGuildTreasury,
  getGuildLogs
} = require("../../repositories/guild.repository");

router.post("/create", async (req, res) => {
  try {
    const { leaderPlayerId, guildName, guildTag } = req.body;

    const result = await createGuild({
      leaderPlayerId,
      guildName,
      guildTag
    });

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

router.post("/join", async (req, res) => {
  try {
    const { playerId, guildId } = req.body;

    const result = await joinGuild({
      playerId,
      guildId
    });

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

router.get("/:guildId", async (req, res) => {
  try {
    const guild = await getGuildById(req.params.guildId);

    if (!guild) {
      return res.status(404).json({
        ok: false,
        error: "guild not found"
      });
    }

    return res.json({
      ok: true,
      guild
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/treasury/:guildId", async (req, res) => {
  try {
    const treasury = await getGuildTreasury(req.params.guildId);

    return res.json({
      ok: true,
      treasury
    });
  } catch (error) {
    return res.status(404).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/treasury/deposit", async (req, res) => {
  try {
    const { guildId, gold, obsidian, usdt } = req.body;

    const treasury = await depositGuildTreasury({
      guildId,
      gold,
      obsidian,
      usdt
    });

    return res.json({
      ok: true,
      treasury
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/logs/:guildId", async (req, res) => {
  try {
    const logs = await getGuildLogs(req.params.guildId);

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

module.exports = router;
