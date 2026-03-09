const express = require("express");
const router = express.Router();

const {
  getWorldOverview,
  getSectorById,
} = require("../repositories/world.repository");

const cache = require("../../utils/cache");

router.get("/", async (req, res) => {
  try {
    const cacheKey = "world:overview";
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        ok: true,
        cached: true,
        world: cached
      });
    }

    const world = await getWorldOverview();

    cache.set(cacheKey, world, 20);

    return res.json({
      ok: true,
      cached: false,
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
    const cacheKey = "world:sectors";
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        ok: true,
        cached: true,
        total: cached.total_sectors,
        sectors: cached.world_sectors
      });
    }

    const world = await getWorldOverview();

    cache.set(cacheKey, world, 20);

    return res.json({
      ok: true,
      cached: false,
      total: world.total_sectors,
      sectors: world.world_sectors
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
    const cacheKey = `world:sector:${req.params.id}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        ok: true,
        cached: true,
        sector: cached
      });
    }

    const sector = await getSectorById(req.params.id);

    if (!sector) {
      return res.status(404).json({
        ok: false,
        error: "sector_not_found"
      });
    }

    cache.set(cacheKey, sector, 20);

    return res.json({
      ok: true,
      cached: false,
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
