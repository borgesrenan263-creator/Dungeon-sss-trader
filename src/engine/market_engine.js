function createMarket() {
  return {
    listings: [],
    nextId: 1,
    taxRate: 0.10,
    treasury: 0
  };
}

function cloneItem(item) {
  return JSON.parse(JSON.stringify(item));
}

function listInventoryEquipment(market, sellerPlayer, itemId, price) {
  const itemIndex = sellerPlayer.inventory.equipments.findIndex((item) => item.id === itemId);

  if (itemIndex === -1) {
    return { ok: false, error: "item_not_in_inventory" };
  }

  if (price <= 0) {
    return { ok: false, error: "invalid_price" };
  }

  const item = sellerPlayer.inventory.equipments[itemIndex];
  sellerPlayer.inventory.equipments.splice(itemIndex, 1);

  const listing = {
    id: market.nextId++,
    seller: sellerPlayer.name,
    item: cloneItem(item),
    price
  };

  market.listings.push(listing);

  return {
    ok: true,
    listing
  };
}

function listEquippedItem(market, sellerPlayer, slot, price) {
  const item = sellerPlayer.equipped[slot];

  if (!item) {
    return { ok: false, error: "empty_slot" };
  }

  if (price <= 0) {
    return { ok: false, error: "invalid_price" };
  }

  sellerPlayer.equipped[slot] = null;

  const listing = {
    id: market.nextId++,
    seller: sellerPlayer.name,
    item: cloneItem(item),
    price
  };

  market.listings.push(listing);

  return {
    ok: true,
    listing
  };
}

function getMarketListings(market) {
  return market.listings;
}

function cancelListing(market, sellerPlayer, listingId) {
  const index = market.listings.findIndex((listing) => listing.id === listingId);

  if (index === -1) {
    return { ok: false, error: "listing_not_found" };
  }

  const listing = market.listings[index];

  if (listing.seller !== sellerPlayer.name) {
    return { ok: false, error: "not_listing_owner" };
  }

  sellerPlayer.inventory.equipments.push(cloneItem(listing.item));
  market.listings.splice(index, 1);

  return {
    ok: true
  };
}

function buyItem(market, buyerPlayer, sellerPlayer, listingId) {
  const index = market.listings.findIndex((listing) => listing.id === listingId);

  if (index === -1) {
    return { ok: false, error: "listing_not_found" };
  }

  const listing = market.listings[index];

  if (buyerPlayer.gold < listing.price) {
    return { ok: false, error: "not_enough_gold" };
  }

  const tax = Math.floor(listing.price * market.taxRate);
  const sellerValue = listing.price - tax;

  buyerPlayer.gold -= listing.price;
  sellerPlayer.gold += sellerValue;
  market.treasury += tax;

  buyerPlayer.inventory.equipments.push(cloneItem(listing.item));
  market.listings.splice(index, 1);

  return {
    ok: true,
    tax,
    sellerValue,
    item: listing.item
  };
}

module.exports = {
  createMarket,
  listInventoryEquipment,
  listEquippedItem,
  getMarketListings,
  cancelListing,
  buyItem
};
