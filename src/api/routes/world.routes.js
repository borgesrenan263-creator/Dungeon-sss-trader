const express = require("express");
const router = express.Router();

const {
  getWorldOverview,
  getSectorById
} = require("../../repositories/world.repository");

router.get("/", async (req, res) => {
  try {
    const world = await getWorldOverview();

    return res.json({
      ok: true,
      world
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/sectors", async (req, res) => {
  try {
    const world = await getWorldOverview();

    return res.json({
      ok: true,
      total: world.total_sectors,
      sectors: world.sectors
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/sector/:id", async (req, res) => {
  try {
    const sector = await getSectorById(req.params.id);

    if (!sector) {
      return res.status(404).json({
        ok: false,
        error: "sector not found"
      });
    }

    return res.json({
      ok: true,
      sector
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
