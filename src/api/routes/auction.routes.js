const express = require("express");
const router = express.Router();

const {
  createAuction,
  placeBid,
  closeAuction,
  listAuctions
} = require("../../repositories/auction.repository");

router.post("/create", async (req, res) => {
  try {
    const { playerId, inventoryId, startPrice } = req.body;

    const result = await createAuction(playerId, inventoryId, startPrice);

    res.json({
      ok: true,
      result
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/bid", async (req, res) => {
  try {
    const { playerId, auctionId, bid } = req.body;

    const result = await placeBid(playerId, auctionId, bid);

    res.json({
      ok: true,
      result
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/close", async (req, res) => {
  try {
    const { auctionId } = req.body;

    const result = await closeAuction(auctionId);

    res.json({
      ok: true,
      result
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/list", async (req, res) => {
  try {
    const auctions = await listAuctions();

    res.json({
      ok: true,
      total: auctions.length,
      auctions
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
