const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    ok: true,
    realtime: {
      enabled: true,
      clients: 0,
      path: "/ws"
    }
  });
});

router.get("/viewer", (req, res) => {
  res.send(`
  <html>
  <body style="background:#111;color:#0f0;font-family:monospace">
  <h2>Dungeon SSS Trader Realtime</h2>
  <p>WebSocket: /ws</p>
  </body>
  </html>
  `);
});

module.exports = router;
