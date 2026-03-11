function createEconomy() {
  return {
    prices: {
      iron_sword: 500,
      leather_armor: 450,
      apprentice_ring: 400,
      refine_stone: 120,
      mana_crystal_f: 80,
      mana_crystal_e: 160
    },
    supply: {
      iron_sword: 10,
      leather_armor: 10,
      apprentice_ring: 10,
      refine_stone: 20,
      mana_crystal_f: 30,
      mana_crystal_e: 15
    },
    demand: {
      iron_sword: 10,
      leather_armor: 10,
      apprentice_ring: 10,
      refine_stone: 20,
      mana_crystal_f: 30,
      mana_crystal_e: 15
    },
    npcTrades: [],
    tick: 0
  };
}

function clampPrice(price) {
  if (price < 10) return 10;
  if (price > 100000) return 100000;
  return Math.floor(price);
}

function recalculatePrice(economy, itemId) {
  const base = economy.prices[itemId] || 100;
  const supply = economy.supply[itemId] || 1;
  const demand = economy.demand[itemId] || 1;

  let nextPrice = base;

  if (demand > supply) {
    nextPrice = base * (1 + (demand - supply) * 0.05);
  } else if (supply > demand) {
    nextPrice = base * (1 - (supply - demand) * 0.03);
  }

  economy.prices[itemId] = clampPrice(nextPrice);
  return economy.prices[itemId];
}

function npcBuy(economy, itemId) {
  economy.demand[itemId] = (economy.demand[itemId] || 0) + 1;

  const price = recalculatePrice(economy, itemId);

  const trade = {
    type: "buy",
    itemId,
    price
  };

  economy.npcTrades.push(trade);
  return trade;
}

function npcSell(economy, itemId) {
  economy.supply[itemId] = (economy.supply[itemId] || 0) + 1;

  const price = recalculatePrice(economy, itemId);

  const trade = {
    type: "sell",
    itemId,
    price
  };

  economy.npcTrades.push(trade);
  return trade;
}

function runEconomyTick(economy) {
  economy.tick += 1;

  const items = Object.keys(economy.prices);
  const itemId = items[Math.floor(Math.random() * items.length)];
  const action = Math.random() < 0.5 ? "buy" : "sell";

  if (action === "buy") {
    return npcBuy(economy, itemId);
  }

  return npcSell(economy, itemId);
}

module.exports = {
  createEconomy,
  recalculatePrice,
  npcBuy,
  npcSell,
  runEconomyTick
};
