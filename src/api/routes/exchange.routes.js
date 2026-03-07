const express = require("express");
const router = express.Router();

const {
  getExchangeRates,
  buyObsidianAtExchange,
  sellObsidianForGold,
  getExchangeHistory
} = require("../../repositories/exchange.repository");

router.get("/rates", async (req, res) => {
  try {
    const rates = await getExchangeRates();

    return res.json({
      ok: true,
      rates
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/buy-obsidian", async (req, res) => {
  try {
    const { playerId, amount } = req.body;

    const result = await buyObsidianAtExchange({ playerId, amount });

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

router.post("/sell-obsidian", async (req, res) => {
  try {
    const { playerId, amount } = req.body;

    const result = await sellObsidianForGold({ playerId, amount });

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

router.get("/history/:playerId", async (req, res) => {
  try {
    const history = await getExchangeHistory(req.params.playerId);

    return res.json({
      ok: true,
      total: history.length,
      history
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
