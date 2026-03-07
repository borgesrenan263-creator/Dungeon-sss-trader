const express = require("express");
const router = express.Router();

const {
  dominateSector,
  getSectorDomination,
  getAllDominations,
  getDominationLogs
} = require("../../repositories/domination.repository");

router.get("/", async (req, res) => {
  try {
    const domination = await getAllDominations();

    return res.json({
      ok: true,
      total: domination.length,
      domination
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/sector/:sectorId", async (req, res) => {
  try {
    const sector = await getSectorDomination(req.params.sectorId);

    return res.json({
      ok: true,
      sector
    });
  } catch (error) {
    return res.status(404).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/claim", async (req, res) => {
  try {
    const { sectorId, className } = req.body;

    const result = await dominateSector({ sectorId, className });

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

router.get("/logs", async (req, res) => {
  try {
    const logs = await getDominationLogs();

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
