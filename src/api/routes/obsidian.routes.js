const express = require("express");
const router = express.Router();

const {
  getObsidianStatus,
  buyObsidian,
  buyMerchantTitle
} = require("../../repositories/obsidian.repository");

router.get("/status", async (req, res) => {
  try {
    const status = await getObsidianStatus();

    return res.json({
      ok: true,
      status
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/buy", async (req, res) => {
  try {
    const { playerId, amount } = req.body;

    const result = await buyObsidian({ playerId, amount });

    return res.json({
      ok: true,
      result
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/merchant-title/buy", async (req, res) => {
  try {
    const { playerId } = req.body;

    const result = await buyMerchantTitle(playerId);

    return res.json({
      ok: true,
      result
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
