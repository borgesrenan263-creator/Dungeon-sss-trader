const express = require("express");
const router = express.Router();

const {
  listItemForSale,
  getActiveListings,
  buyListing,
  getMarketSales
} = require("../../repositories/market.repository");

router.get("/listings", async (req, res) => {
  try {
    const listings = await getActiveListings();

    return res.json({
      ok: true,
      total: listings.length,
      listings
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/list", async (req, res) => {
  try {
    const { sellerPlayerId, inventoryId, priceUsdt } = req.body;

    const result = await listItemForSale({
      sellerPlayerId,
      inventoryId,
      priceUsdt
    });

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

router.post("/buy", async (req, res) => {
  try {
    const { buyerPlayerId, listingId } = req.body;

    const result = await buyListing({
      buyerPlayerId,
      listingId
    });

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

router.get("/sales", async (req, res) => {
  try {
    const sales = await getMarketSales();

    return res.json({
      ok: true,
      total: sales.length,
      sales
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
