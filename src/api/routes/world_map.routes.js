const express = require("express");
const router = express.Router();

const cache = require("../../utils/cache");
const worldRepository = require("../repositories/world.repository");

router.get("/world", async (req, res) => {
  try {
    const cacheKey = "worldmap:world";
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        ok: true,
        cached: true,
        ...cached
      });
    }

    const world = await worldRepository.getWorldOverview();

    const payload = {
      total_nodes: world.total_nodes || 0,
      total_links: world.total_links || 0,
      total_events: world.total_events || 0,
      nodes: world.world_nodes || world.nodes || []
    };

    cache.set(cacheKey, payload, 20);

    return res.json({
      ok: true,
      cached: false,
      ...payload
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/links", async (req, res) => {
  try {
    const cacheKey = "worldmap:links";
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({
        ok: true,
        cached: true,
        total: cached.length,
        links: cached
      });
    }

    const world = await worldRepository.getWorldOverview();
    const links = world.links || world.world_links || [];

    cache.set(cacheKey, links, 20);

    return res.json({
      ok: true,
      cached: false,
      total: links.length,
      links
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/events", async (req, res) => {
  try {
    const history = cache.get("world:event_history") || [];

    return res.json({
      ok: true,
      cached: true,
      total: history.length,
      events: history
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
