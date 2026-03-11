const express = require("express");
const { state } = require("../state/game.state");
const { getWorldState } = require("../../engine/world_loop_engine");
const {
  initPersistence,
  savePlayers,
  loadPlayers,
  saveWorld,
  loadWorld,
  saveMarket,
  loadMarket
} = require("../../engine/persistence_engine");

const router = express.Router();

router.post("/init", async (req, res) => {
  try {
    const result = await initPersistence();
    return res.status(200).json({
      ok: true,
      result
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

router.post("/save", async (req, res) => {
  try {
    const playersSaved = await savePlayers(state.players);
    const worldSaved = await saveWorld(getWorldState());
    const marketSaved = await saveMarket(state.market);

    return res.status(200).json({
      ok: true,
      saved: {
        players: playersSaved.saved,
        market: marketSaved.saved,
        world: worldSaved.ok
      }
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

router.get("/load", async (req, res) => {
  try {
    const players = await loadPlayers();
    const world = await loadWorld();
    const market = await loadMarket();

    return res.status(200).json({
      ok: true,
      data: {
        players,
        world,
        market
      }
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

module.exports = router;
