const express = require("express");
const router = express.Router();

const {
  declareGuildWar,
  addGuildWarScore,
  finishGuildWar,
  getGuildWarById,
  getGuildWarLogs
} = require("../../repositories/guildwar.repository");

router.post("/declare", async (req, res) => {
  try {
    const { attackerGuildId, defenderGuildId, sectorId } = req.body;

    const result = await declareGuildWar({
      attackerGuildId,
      defenderGuildId,
      sectorId
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post("/score", async (req, res) => {
  try {
    const { warId, guildId, points } = req.body;

    const result = await addGuildWarScore({
      warId,
      guildId,
      points
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post("/finish", async (req, res) => {
  try {
    const { warId } = req.body;

    const result = await finishGuildWar(warId);

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.get("/:warId", async (req, res) => {
  try {
    const war = await getGuildWarById(req.params.warId);

    res.json({ ok: true, war });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.get("/logs/:warId", async (req, res) => {
  try {
    const logs = await getGuildWarLogs(req.params.warId);

    res.json({ ok: true, logs });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

module.exports = router;
