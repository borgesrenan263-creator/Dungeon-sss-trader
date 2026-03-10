function createMarket() {
  return {
    listings: []
  };
}

function listItem(market, seller, item, price) {
  market.listings.push({
    seller,
    item,
    price
  });
  return market;
}

function buyItem(market, buyerGold, index) {
  const listing = market.listings[index];

  if (!listing) {
    throw new Error("listing_not_found");
  }

  if (buyerGold < listing.price) {
    throw new Error("not_enough_gold");
  }

  market.listings.splice(index, 1);

  return listing.item;
}

module.exports = {
  createMarket,
  listItem,
  buyItem
};
