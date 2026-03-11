const express = require("express");
const { getWorldState } = require("../../engine/world_loop_engine");
const { getTelemetry } = require("../../engine/telemetry_engine");

const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    telemetry: getTelemetry(getWorldState())
  });
});

module.exports = router;
