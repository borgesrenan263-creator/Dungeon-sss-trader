const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    telemetry: {
      cpu: 0,
      memory: 0,
      uptimeSeconds: 0,
      ticksPerSecond: 1
    }
  });
});

module.exports = router;
