const express = require("express");
const { getRealtimeStats, broadcast } = require("../../realtime/live_hub");
const { renderRealtimePage } = require("../../realtime/client_page");

const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    realtime: getRealtimeStats()
  });
});

router.get("/viewer", (req, res) => {
  const protocol = req.headers.host && req.headers.host.includes("127.0.0.1")
    ? "ws"
    : "wss";

  const wsUrl = protocol + "://" + req.headers.host + "/ws";
  return res.status(200).send(renderRealtimePage(wsUrl));
});

router.post("/broadcast-test", (req, res) => {
  const payload = {
    message: "manual realtime test",
    at: Date.now()
  };

  broadcast("manual:test", payload);

  return res.status(200).json({
    ok: true,
    sent: payload
  });
});

module.exports = router;
