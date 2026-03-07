const express = require("express");
const router = express.Router();

const {
  getCityOverview,
  getCityNpcs,
  getCityFacilities,
  enterCity,
  leaveCity,
  getCityPlayers,
  openCityStall,
  closeCityStall,
  getActiveCityStalls
} = require("../../repositories/city.repository");

router.get("/overview", async (req, res) => {
  try {
    const overview = await getCityOverview();

    res.json({
      ok: true,
      overview
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/npcs", async (req, res) => {
  try {
    const npcs = await getCityNpcs();

    res.json({
      ok: true,
      total: npcs.length,
      npcs
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/facilities", async (req, res) => {
  try {
    const facilities = await getCityFacilities();

    res.json({
      ok: true,
      total: facilities.length,
      facilities
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/players", async (req, res) => {
  try {
    const players = await getCityPlayers();

    res.json({
      ok: true,
      total: players.length,
      players
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
    const { playerId, zone } = req.body;

    const result = await enterCity({
      playerId,
      zone
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

router.post("/leave", async (req, res) => {
  try {
    const { playerId } = req.body;

    const result = await leaveCity({
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

router.get("/stalls", async (req, res) => {
  try {
    const stalls = await getActiveCityStalls();

    res.json({
      ok: true,
      total: stalls.length,
      stalls
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/stalls/open", async (req, res) => {
  try {
    const { playerId, stallName, zoneKey } = req.body;

    const result = await openCityStall({
      playerId,
      stallName,
      zoneKey
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

router.post("/stalls/close", async (req, res) => {
  try {
    const { playerId, stallId } = req.body;

    const result = await closeCityStall({
      playerId,
      stallId
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
