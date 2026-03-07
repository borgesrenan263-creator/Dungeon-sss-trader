const express = require("express");
const router = express.Router();

const {
  createTrade,
  addTradeItem,
  addTradeGold,
  acceptTrade,
  cancelTrade,
  getTradesByPlayer,
  getTradeState
} = require("../../repositories/trade.repository");

router.post("/create", async (req, res) => {
  try {
    const { player1Id, player2Id } = req.body;

    const result = await createTrade({
      player1Id,
      player2Id
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post("/add-item", async (req, res) => {
  try {
    const { tradeId, ownerPlayerId, inventoryId } = req.body;

    const result = await addTradeItem({
      tradeId,
      ownerPlayerId,
      inventoryId
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post("/add-gold", async (req, res) => {
  try {
    const { tradeId, ownerPlayerId, goldAmount } = req.body;

    const result = await addTradeGold({
      tradeId,
      ownerPlayerId,
      goldAmount
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post("/accept", async (req, res) => {
  try {
    const { tradeId, playerId } = req.body;

    const result = await acceptTrade({
      tradeId,
      playerId
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post("/cancel", async (req, res) => {
  try {
    const { tradeId, playerId } = req.body;

    const result = await cancelTrade({
      tradeId,
      playerId
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.get("/player/:playerId", async (req, res) => {
  try {
    const trades = await getTradesByPlayer(req.params.playerId);

    res.json({
      ok: true,
      total: trades.length,
      trades
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get("/:tradeId", async (req, res) => {
  try {
    const trade = await getTradeState(req.params.tradeId);

    res.json({
      ok: true,
      trade
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

module.exports = router;
