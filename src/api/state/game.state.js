const { createEquipmentPlayer } = require("../../engine/equipment_engine");
const { createSectorPlayer, moveToSector } = require("../../engine/sector_engine");
const {
  createGalaxyBoss,
  joinGalaxyBoss,
  attackGalaxyBoss,
  finishGalaxyBoss
} = require("../../engine/galaxy_boss_engine");
const { getWorldState } = require("../../engine/world_loop_engine");

const state = {
  players: {},
  sectorPlayers: {},
  galaxyBoss: null,
  market: {
    listings: [],
    treasury: 0,
    taxRate: 0.1,
    nextListingId: 1
  },
  onlinePlayers: {}
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
  player.gold = typeof player.gold === "number" ? player.gold : 1000;
  player.nickname = identity.nickname;
  player.hp = typeof player.hp === "number" ? player.hp : 100;
  player.maxHp = typeof player.maxHp === "number" ? player.maxHp : 100;
  player.isOnline = false;
  player.lastSeen = null;
  player.dropLog = Array.isArray(player.dropLog) ? player.dropLog : [];
  player.pvpWins = typeof player.pvpWins === "number" ? player.pvpWins : 0;
  player.pvpLosses = typeof player.pvpLosses === "number" ? player.pvpLosses : 0;

  if (!player.inventory) {
    player.inventory = { materials: [], equipments: [] };
  }

  if (!Array.isArray(player.inventory.materials)) {
    player.inventory.materials = [];
  }

  if (!Array.isArray(player.inventory.equipments)) {
    player.inventory.equipments = [];
  }

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

  return { player, sector };
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

function loginPlayer(payload = {}) {
  const created = createPlayerProfile(payload);
  const player = created.player;
  const now = new Date().toISOString();

  player.isOnline = true;
  player.lastSeen = now;

  state.onlinePlayers[player.name] = {
    name: player.name,
    nickname: player.nickname,
    loginAt: now,
    lastSeen: now
  };

  return {
    ok: true,
    player,
    online: state.onlinePlayers[player.name]
  };
}

function logoutPlayer(name) {
  const key = String(name || "").trim();
  const player = state.players[key];

  if (!player) {
    return { ok: false, error: "player_not_found" };
  }

  player.isOnline = false;
  player.lastSeen = new Date().toISOString();

  delete state.onlinePlayers[key];

  return {
    ok: true,
    player
  };
}

function touchOnlinePlayer(name) {
  const key = String(name || "").trim();
  const player = state.players[key];

  if (!player) {
    return null;
  }

  if (state.onlinePlayers[key]) {
    state.onlinePlayers[key].lastSeen = new Date().toISOString();
    player.lastSeen = state.onlinePlayers[key].lastSeen;
  }

  return player;
}

function getOnlinePlayers() {
  return Object.values(state.onlinePlayers);
}

function registerDropForPlayer(name, drop) {
  const player = getPlayerByName(name);

  if (!player) {
    return { ok: false, error: "player_not_found" };
  }

  if (!Array.isArray(player.dropLog)) {
    player.dropLog = [];
  }

  player.dropLog.unshift({
    name: drop.name,
    id: drop.id,
    type: drop.type,
    at: new Date().toISOString()
  });

  player.dropLog = player.dropLog.slice(0, 20);

  return {
    ok: true,
    drops: player.dropLog
  };
}

function getPlayerDrops(name) {
  const player = getPlayerByName(name);

  if (!player) {
    return null;
  }

  if (!Array.isArray(player.dropLog)) {
    player.dropLog = [];
  }

  return player.dropLog;
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

  touchOnlinePlayer(key);

  const boss = ensureGalaxyBoss();
  return joinGalaxyBoss(boss, key);
}

function attackGalaxy(name, damage) {
  const key = String(name || "").trim();

  if (!state.players[key]) {
    return { ok: false, error: "player_not_found" };
  }

  touchOnlinePlayer(key);

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

function getPlayerByName(name) {
  const key = String(name || "").trim();
  return state.players[key] || null;
}

function getMarketState() {
  return state.market;
}

function getMarketView() {
  return {
    listings: state.market.listings,
    treasury: state.market.treasury,
    taxRate: state.market.taxRate
  };
}

function listPlayerItemOnMarket(playerName, itemId, price) {
  const seller = getPlayerByName(playerName);

  if (!seller) {
    return { ok: false, error: "player_not_found" };
  }

  touchOnlinePlayer(playerName);

  const numericPrice = Number(price);

  if (!numericPrice || numericPrice <= 0) {
    return { ok: false, error: "invalid_price" };
  }

  const inventory = seller.inventory?.equipments || [];
  const index = inventory.findIndex((item) => item.id === itemId);

  if (index === -1) {
    return { ok: false, error: "item_not_found" };
  }

  const item = inventory.splice(index, 1)[0];

  const listing = {
    id: state.market.nextListingId++,
    seller: seller.name,
    price: numericPrice,
    item
  };

  state.market.listings.push(listing);

  return {
    ok: true,
    listing
  };
}

function buyMarketItem(buyerName, listingId) {
  const buyer = getPlayerByName(buyerName);

  if (!buyer) {
    return { ok: false };
  }

  const listingIndex = state.market.listings.findIndex(
    (item) => item.id === Number(listingId)
  );

  if (listingIndex === -1) {
    return { ok: false };
  }

  const listing = state.market.listings[listingIndex];
  const seller = getPlayerByName(listing.seller);

  if (!seller) {
    return { ok: false };
  }

  if (typeof buyer.gold !== "number") {
    buyer.gold = 1000;
  }

  if (typeof seller.gold !== "number") {
    seller.gold = 1000;
  }

  buyer.gold -= listing.price;
  seller.gold += listing.price;

  if (!buyer.inventory) {
    buyer.inventory = { equipments: [], materials: [] };
  }

  if (!Array.isArray(buyer.inventory.equipments)) {
    buyer.inventory.equipments = [];
  }

  buyer.inventory.equipments.push(listing.item);

  state.market.listings.splice(listingIndex, 1);

  return {
    ok: true,
    item: listing.item
  };
}

function getApiWorldState() {
  const world = getWorldState();

  return {
    ticks: world.ticks,
    mobsSpawned: world.mobsSpawned,
    activeGalaxyBoss: world.activeGalaxyBoss,
    economy: world.economy,
    globalEvents: world.globalEvents.slice(-10),
    onlinePlayers: getOnlinePlayers()
  };
}

module.exports = {
  state,
  createPlayerProfile,
  getPlayerProfile,
  movePlayerSector,
  loginPlayer,
  logoutPlayer,
  touchOnlinePlayer,
  getOnlinePlayers,
  registerDropForPlayer,
  getPlayerDrops,
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
