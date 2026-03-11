const express = require("express");
const {
  getMarketView,
  listPlayerItemOnMarket,
  buyMarketItem
} = require("../state/game.state");

const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    market: getMarketView()
  });
});

router.post("/list", (req, res) => {
  const { playerName, itemId, price } = req.body || {};

  if (!playerName || !itemId || !price) {
    return res.status(400).json({
      ok: false,
      error: "playerName_itemId_price_required"
    });
  }

  const listed = listPlayerItemOnMarket(playerName, itemId, price);

  if (!listed.ok) {
    return res.status(400).json(listed);
  }

  return res.status(200).json(listed);
});

router.post("/buy", (req, res) => {
  const { buyerName, listingId } = req.body || {};

  if (!buyerName || !listingId) {
    return res.status(400).json({
      ok: false,
      error: "buyerName_listingId_required"
    });
  }

  const bought = buyMarketItem(buyerName, listingId);

  if (!bought.ok) {
    return res.status(400).json(bought);
  }

  return res.status(200).json(bought);
});

module.exports = router;
