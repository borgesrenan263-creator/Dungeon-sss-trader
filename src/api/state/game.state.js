const { createEquipmentPlayer } = require("../../engine/equipment_engine");
const { createSectorPlayer, moveToSector } = require("../../engine/sector_engine");
const {
  createGalaxyBoss,
  joinGalaxyBoss,
  attackGalaxyBoss,
  finishGalaxyBoss
} = require("../../engine/galaxy_boss_engine");
const { getWorldState } = require("../../engine/world_loop_engine");
const {
  createMarket,
  listInventoryEquipment,
  buyItem,
  getMarketListings
} = require("../../engine/market_engine");

const state = {
  players: {},
  sectorPlayers: {},
  galaxyBoss: null,
  market: createMarket()
};

function buildPlayerIdentity(payload = {}) {
  const rawName = payload.name || payload.nickname || "";
  const safeName = String(rawName).trim() || ("Player_" + Math.floor(Math.random() * 10000));

  return {
    name: safeName,
    nickname: String(payload.nickname || safeName).trim() || safeName
  };
}

function createPlayerProfile(payload = {}) {
  const identity = buildPlayerIdentity(payload);
  const key = identity.name;

  if (state.players[key]) {
    return {
      ok: true,
      player: state.players[key],
      sector: state.sectorPlayers[key],
      reused: true
    };
  }

  const player = createEquipmentPlayer(identity.name);
  player.gold = 1000;
  player.nickname = identity.nickname;

  state.players[key] = player;
  state.sectorPlayers[key] = createSectorPlayer(identity.name);

  return {
    ok: true,
    player: state.players[key],
    sector: state.sectorPlayers[key]
  };
}

function getPlayerProfile(name) {
  const key = String(name || "").trim();
  const player = state.players[key];
  const sector = state.sectorPlayers[key];

  if (!player || !sector) {
    return null;
  }

  return {
    player,
    sector
  };
}

function movePlayerSector(name, sectorNumber) {
  const key = String(name || "").trim();
  const sectorPlayer = state.sectorPlayers[key];

  if (!sectorPlayer) {
    return { ok: false, error: "player_not_found" };
  }

  const moved = moveToSector(sectorPlayer, sectorNumber);

  return {
    ok: true,
    moved
  };
}

function ensureGalaxyBoss() {
  if (!state.galaxyBoss || !state.galaxyBoss.alive) {
    state.galaxyBoss = createGalaxyBoss();
  }

  return state.galaxyBoss;
}

function joinGalaxy(name) {
  const key = String(name || "").trim();

  if (!state.players[key]) {
    return { ok: false, error: "player_not_found" };
  }

  const boss = ensureGalaxyBoss();
  return joinGalaxyBoss(boss, key);
}

function attackGalaxy(name, damage) {
  const key = String(name || "").trim();

  if (!state.players[key]) {
    return { ok: false, error: "player_not_found" };
  }

  const boss = ensureGalaxyBoss();
  const attack = attackGalaxyBoss(boss, key, damage);

  if (attack.killed) {
    const finish = finishGalaxyBoss(boss);
    return {
      ok: true,
      attack,
      finish
    };
  }

  return {
    ok: true,
    attack
  };
}

function getGalaxyState() {
  return ensureGalaxyBoss();
}

function getApiWorldState() {
  const world = getWorldState();

  return {
    ticks: world.ticks,
    mobsSpawned: world.mobsSpawned,
    activeGalaxyBoss: world.activeGalaxyBoss,
    economy: world.economy,
    globalEvents: world.globalEvents.slice(-10)
  };
}

function getPlayerByName(name) {
  const key = String(name || "").trim();
  return state.players[key] || null;
}

function getMarketState() {
  return state.market;
}

function getMarketView() {
  return {
    listings: getMarketListings(state.market),
    treasury: state.market.treasury,
    taxRate: state.market.taxRate
  };
}

function listPlayerItemOnMarket(playerName, itemId, price) {
  const seller = getPlayerByName(playerName);

  if (!seller) {
    return { ok: false, error: "player_not_found" };
  }

  return listInventoryEquipment(state.market, seller, itemId, Number(price));
}

function buyMarketItem(buyerName, listingId) {
  const buyer = getPlayerByName(buyerName);

  if (!buyer) {
    return { ok: false, error: "buyer_not_found" };
  }

  const listing = state.market.listings.find((item) => item.id === Number(listingId));

  if (!listing) {
    return { ok: false, error: "listing_not_found" };
  }

  const seller = getPlayerByName(listing.seller);

  if (!seller) {
    return { ok: false, error: "seller_not_found" };
  }

  return buyItem(state.market, buyer, seller, Number(listingId));
}

module.exports = {
  state,
  createPlayerProfile,
  getPlayerProfile,
  movePlayerSector,
  joinGalaxy,
  attackGalaxy,
  getGalaxyState,
  getApiWorldState,
  getPlayerByName,
  getMarketState,
  getMarketView,
  listPlayerItemOnMarket,
  buyMarketItem
};
