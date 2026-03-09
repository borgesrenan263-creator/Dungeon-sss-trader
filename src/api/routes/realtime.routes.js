const express = require("express");
const router = express.Router();

const cache = require("../../utils/cache");
const { emitWorldEvent } = require("../../utils/realtime");
const { buildRandomWorldEvent } = require("../../events/world_events");
const { getDirectorStatus } = require("../../services/ai_game_director");

router.get("/status", (req, res) => {
  res.json({
    ok: true,
    director: getDirectorStatus(),
    lastEvent: cache.get("world:last_event") || null,
    history: cache.get("world:event_history") || []
  });
});

router.post("/test-event", (req, res) => {
  const event = {
    type: req.body.type || "manual_test",
    title: req.body.title || "Manual Test Event",
    message: req.body.message || "Evento manual disparado com sucesso",
    sector: req.body.sector || "Shadow Forest",
    reward: req.body.reward || "Debug Reward",
    timestamp: new Date().toISOString()
  };

  const history = cache.get("world:event_history") || [];
  history.unshift(event);

  cache.set("world:event_history", history.slice(0, 20), 3600);
  cache.set("world:last_event", event, 3600);

  emitWorldEvent("world:event", event);

  res.json({
    ok: true,
    emitted: event
  });
});

router.post("/random-event", (req, res) => {
  const event = buildRandomWorldEvent();

  const history = cache.get("world:event_history") || [];
  history.unshift(event);

  cache.set("world:event_history", history.slice(0, 20), 3600);
  cache.set("world:last_event", event, 3600);

  emitWorldEvent("world:event", event);

  res.json({
    ok: true,
    emitted: event
  });
});

module.exports = router;
