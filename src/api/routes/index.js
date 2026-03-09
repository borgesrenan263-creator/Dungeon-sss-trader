const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const routesDir = __dirname;

function firstExisting(candidates) {
  for (const file of candidates) {
    const full = path.join(routesDir, file);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function mount(prefix, candidates) {
  const full = firstExisting(candidates);

  if (!full) {
    console.log(`[routes] skip ${prefix} -> ${candidates.join(" | ")}`);
    return;
  }

  const mod = require(full);
  router.use(prefix, mod);
  console.log(`[routes] mounted ${prefix} -> ${path.basename(full)}`);
}

mount("/arena", ["arena.routes.js"]);
mount("/auction", ["auction.routes.js"]);
mount("/boss", ["boss.routes.js"]);
mount("/character", ["character.routes.js"]);
mount("/city", ["city.routes.js"]);
mount("/combat", ["combat.routes.js"]);
mount("/crystal", ["crystal.routes.js"]);
mount("/domination", ["domination.routes.js"]);
mount("/drops", ["drops.routes.js"]);
mount("/dungeon", ["dungeon.routes.js"]);
mount("/equipment", ["equipment.routes.js"]);
mount("/events", ["events.routes.js"]);
mount("/exchange", ["exchange.routes.js"]);
mount("/exchange-gold", ["exchange_gold.routes.js", "exchange-gold.routes.js"]);
mount("/forge", ["forge.routes.js"]);
mount("/galaxy", ["galaxy.routes.js"]);
mount("/goldmarket", ["goldmarket.routes.js", "gold_market.routes.js"]);
mount("/guild", ["guild.routes.js"]);
mount("/guildfull", ["guild_full.routes.js", "guildfull.routes.js"]);
mount("/guildwar", ["guildwar.routes.js", "guild_war.routes.js"]);
mount("/hub", ["hub.routes.js"]);
mount("/items", ["items.routes.js"]);
mount("/map", ["map.routes.js"]);
mount("/market", ["market.routes.js"]);
mount("/obsidian", ["obsidian.routes.js"]);
mount("/party", ["party.routes.js"]);
mount("/partycoop", ["party_coop.routes.js", "party-coop.routes.js"]);
mount("/pets", ["pets.routes.js"]);
mount("/player", ["player.routes.js", "players.routes.js"]);
mount("/players", ["players.routes.js", "player.routes.js"]);
mount("/raid", ["raid.routes.js"]);
mount("/ranking", ["ranking.routes.js"]);
mount("/realtime", ["realtime.routes.js"]);
mount("/skills", ["skills.routes.js"]);
mount("/spawn", ["spawn.routes.js"]);
mount("/storage", ["storage.routes.js"]);
mount("/trade", ["trade.routes.js"]);
mount("/world", ["world.routes.js"]);
mount("/worldmap", ["world_map.routes.js", "worldmap.routes.js"]);

module.exports = router;
