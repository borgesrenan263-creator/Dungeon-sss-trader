const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).send(`
    <html>
    <body style="background:#111;color:#0f0;font-family:monospace">
      <h1>Dungeon SSS Trader Dashboard</h1>
      <h2>World</h2>
      <p>World simulation running</p>
      <h2>Market</h2>
      <p>Market engine active</p>
    </body>
    </html>
  `);
});

module.exports = router;
