const express = require("express");
const router = express.Router();

const { ok, fail } = require("../../utils/api.response");
const { getPlayerByName } = require("../state/game.state");

let listings = [];
let nextListingId = 1;

router.get("/", (req, res) => {
  return ok(res, {
    market: {
      listings
    }
  });
});

router.post("/list", (req, res) => {

  const playerName = req.body.playerName;
  const itemId = req.body.itemId;
  const price = req.body.price;

  const player = getPlayerByName(playerName);

  if (!player) {
    return fail(res, "player_not_found", 404);
  }

  const listing = {
    id: nextListingId++,
    seller: playerName,
    itemId,
    price
  };

  listings.push(listing);

  return ok(res, { listing });
});

router.post("/buy", (req, res) => {

  const buyerName =
    req.body.buyerName ||
    req.body.playerName;

  const listingId = req.body.listingId;

  const player = getPlayerByName(buyerName);

  if (!player) {
    return fail(res, "player_not_found", 404);
  }

  const index = listings.findIndex(l => l.id === listingId);

  if (index === -1) {
    return fail(res, "listing_not_found", 404);
  }

  const listing = listings[index];

  listings.splice(index, 1);

  return ok(res, {
    bought: true,
    listing
  });
});

module.exports = router;
