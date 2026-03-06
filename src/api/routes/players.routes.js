const express = require("express");
const router = express.Router();

const {
  ensurePlayersTables,
  createPlayer,
  getAllPlayers,
  getPlayerById
} = require("../../repositories/players.repository");

const { initDB, saveDB } = require("../../config/database");

ensurePlayersTables();

router.post("/create", async (req, res) => {
  try {
    const { nickname, className } = req.body;

    const allowedClasses = ["Cavaleiro", "Mago", "Caçador"];

    if (!allowedClasses.includes(className)) {
      return res.status(400).json({
        ok: false,
        error: "className must be Cavaleiro, Mago or Caçador"
      });
    }

    const player = await createPlayer({ nickname, className });

    return res.status(201).json({
      ok: true,
      player
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const players = await getAllPlayers();

    return res.json({
      ok: true,
      total: players.length,
      players
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const player = await getPlayerById(req.params.id);

    if (!player) {
      return res.status(404).json({
        ok: false,
        error: "player not found"
      });
    }

    return res.json({
      ok: true,
      player
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/wallet/add-usdt", async (req, res) => {
  try {
    const { playerId, amount } = req.body;

    const db = await initDB();

    db.run(
      `UPDATE currencies
       SET usdt = usdt + ?
       WHERE player_id = ?;`,
      [Number(amount), Number(playerId)]
    );

    saveDB();

    return res.json({
      ok: true,
      player_id: Number(playerId),
      usdt_added: Number(amount)
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
