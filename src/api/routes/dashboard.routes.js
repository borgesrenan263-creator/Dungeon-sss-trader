const express = require("express");
const { getApiWorldState, getMarketView, getGalaxyState, getOnlinePlayers, state } = require("../state/game.state");
const { getTopByGold, getTopByPvp } = require("../../engine/leaderboard_engine");
const { getWorldAnalytics } = require("../../engine/analytics_engine");
const { getTelemetry } = require("../../engine/telemetry_engine");
const { getWorldState } = require("../../engine/world_loop_engine");

const router = express.Router();

function renderList(items) {
  if (!items || items.length === 0) {
    return "<li>none</li>";
  }
  return items.map((item) => `<li>${item}</li>`).join("");
}

function renderMarketListings(listings) {
  if (!listings || listings.length === 0) {
    return "<li>none</li>";
  }

  return listings
    .map((listing) => `<li>#${listing.id} - ${listing.item.name} | seller: ${listing.seller} | price: ${listing.price}</li>`)
    .join("");
}

function renderOnlinePlayers(players) {
  if (!players || players.length === 0) {
    return "<li>none</li>";
  }

  return players
    .map((player) => `<li>${player.name} (${player.nickname || player.name})</li>`)
    .join("");
}

function renderEconomyPrices(prices) {
  return Object.entries(prices || {})
    .map(([key, value]) => `<li>${key}: ${value}</li>`)
    .join("");
}

function renderTopGold(rows) {
  if (!rows.length) return "<li>none</li>";
  return rows.map((row) => `<li>#${row.rank} ${row.name} - gold: ${row.gold}</li>`).join("");
}

function renderTopPvp(rows) {
  if (!rows.length) return "<li>none</li>";
  return rows.map((row) => `<li>#${row.rank} ${row.name} - wins: ${row.wins} / losses: ${row.losses}</li>`).join("");
}

router.get("/", (req, res) => {
  const world = getApiWorldState();
  const market = getMarketView();
  const boss = getGalaxyState();
  const online = getOnlinePlayers();
  const analytics = getWorldAnalytics(getWorldState(), state);
  const telemetry = getTelemetry(getWorldState());
  const topGold = getTopByGold(state.players);
  const topPvp = getTopByPvp(state.players);

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="refresh" content="5" />
      <title>Dungeon SSS Trader Dashboard</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #0f172a;
          color: #e2e8f0;
          margin: 0;
          padding: 20px;
        }
        h1, h2 { margin-top: 0; }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }
        .card {
          background: #111827;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        }
        .value {
          font-size: 1.4rem;
          font-weight: bold;
          color: #22c55e;
        }
        ul { padding-left: 18px; }
        .muted {
          color: #94a3b8;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <h1>🎮 Dungeon SSS Trader Dashboard</h1>
      <p class="muted">Live world state powered by Express API and game engines. Auto refresh: 5s</p>

      <div class="grid">
        <div class="card">
          <h2>🌍 World</h2>
          <p>Tick: <span class="value">${world.ticks}</span></p>
          <p>Mobs Spawned: <span class="value">${world.mobsSpawned}</span></p>
          <p>Global Events Stored: <span class="value">${(world.globalEvents || []).length}</span></p>
        </div>

        <div class="card">
          <h2>👥 Online Players</h2>
          <p>Total: <span class="value">${online.length}</span></p>
          <ul>${renderOnlinePlayers(online)}</ul>
        </div>

        <div class="card">
          <h2>👑 Galaxy Boss</h2>
          <p>Name: <span class="value">${boss.name}</span></p>
          <p>HP: <span class="value">${boss.hp}/${boss.maxHp}</span></p>
          <p>Alive: <span class="value">${boss.alive ? "YES" : "NO"}</span></p>
          <p>Participants: <span class="value">${boss.participants.length}/${boss.maxPlayers}</span></p>
        </div>

        <div class="card">
          <h2>🏪 Market</h2>
          <p>Listings: <span class="value">${market.listings.length}</span></p>
          <p>Treasury: <span class="value">${market.treasury}</span></p>
          <p>Tax Rate: <span class="value">${market.taxRate}</span></p>
          <ul>${renderMarketListings(market.listings)}</ul>
        </div>

        <div class="card">
          <h2>📢 Recent Events</h2>
          <ul>${renderList(world.globalEvents || [])}</ul>
        </div>

        <div class="card">
          <h2>💰 Economy Prices</h2>
          <ul>${renderEconomyPrices(world.economy?.prices || {})}</ul>
        </div>

        <div class="card">
          <h2>🏆 Leaderboard Gold</h2>
          <ul>${renderTopGold(topGold)}</ul>
        </div>

        <div class="card">
          <h2>⚔️ Leaderboard PvP</h2>
          <ul>${renderTopPvp(topPvp)}</ul>
        </div>

        <div class="card">
          <h2>📈 Analytics</h2>
          <p>Spawn Rate: <span class="value">${analytics.spawnRate}</span></p>
          <p>Event Rate: <span class="value">${analytics.eventRate}</span></p>
          <p>Market Listings: <span class="value">${analytics.marketListings}</span></p>
          <p>Online Players: <span class="value">${analytics.onlinePlayers}</span></p>
        </div>

        <div class="card">
          <h2>🧠 Telemetry</h2>
          <p>Uptime: <span class="value">${telemetry.uptimeSeconds}s</span></p>
          <p>TPS: <span class="value">${telemetry.ticksPerSecond}</span></p>
          <p>Economy Ticks: <span class="value">${telemetry.totalEconomyTicks}</span></p>
          <p>Boss Spawns: <span class="value">${telemetry.totalBossSpawns}</span></p>
          <p>Global Events: <span class="value">${telemetry.totalGlobalEvents}</span></p>
          <p>Mob Spawns: <span class="value">${telemetry.totalMobSpawns}</span></p>
        </div>
      </div>
    </body>
  </html>
  `;

  res.status(200).send(html);
});

module.exports = router;
