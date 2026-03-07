const express = require("express");
const router = express.Router();

const {
  createGoldListing,
  getGoldListings,
  buyGoldListing,
  getGoldSales
} = require("../../repositories/goldmarket.repository");

router.post("/list", async (req, res) => {
  try {
    const { sellerPlayerId, inventoryId, priceGold } = req.body;

    const result = await createGoldListing({
      sellerPlayerId,
      inventoryId,
      priceGold
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.get("/listings", async (req, res) => {
  try {
    const listings = await getGoldListings();

    res.json({
      ok: true,
      total: listings.length,
      listings
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post("/buy", async (req, res) => {
  try {
    const { buyerPlayerId, listingId } = req.body;

    const result = await buyGoldListing({
      buyerPlayerId,
      listingId
    });

    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.get("/sales", async (req, res) => {
  try {
    const sales = await getGoldSales();

    res.json({
      ok: true,
      total: sales.length,
      sales
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
