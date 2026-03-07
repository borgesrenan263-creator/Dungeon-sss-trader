const express = require("express");
const router = express.Router();

const {
  createEvent,
  getEventFeed,
  broadcastSystemEvent
} = require("../../repositories/events.repository");

router.get("/feed", async (req, res) => {
  try {
    const events = await getEventFeed(req.query.limit);

    return res.json({
      ok: true,
      total: events.length,
      events
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/create", async (req, res) => {
  try {
    const { eventType, title, message, metadata } = req.body;

    const event = await createEvent({
      eventType,
      title,
      message,
      metadata
    });

    return res.json({
      ok: true,
      event
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/broadcast", async (req, res) => {
  try {
    const { title, message } = req.body;

    const event = await broadcastSystemEvent({
      title,
      message
    });

    return res.json({
      ok: true,
      event
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
