const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    realtime: {
      enabled: true,
      clients: 0,
      path: "/ws"
    }
  });
});

router.get("/viewer", (req, res) => {
  return res.status(200).send(`
    <html>
      <head>
        <title>Dungeon SSS Trader Realtime</title>
      </head>
      <body style="background:#111;color:#0f0;font-family:monospace">
        <h1>Dungeon SSS Trader Realtime</h1>
        <p>WebSocket viewer online</p>
      </body>
    </html>
  `);
});

router.post("/broadcast-test", (req, res) => {
  const sent = {
    type: "manual:test",
    at: Date.now(),
    message: "manual realtime test"
  };

  return res.status(200).json({
    ok: true,
    sent
  });
});

module.exports = router;
