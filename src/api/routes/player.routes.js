const express = require("express");

const {
  connectPlayer,
  disconnectPlayer,
  movePlayer,
  getPlayers
} = require("../../engine/player_session_engine");

const router = express.Router();

router.post("/connect/:id", (req, res) => {
  const player = connectPlayer(req.params.id);
  res.json({ ok: true, player });
});

router.post("/disconnect/:id", (req, res) => {
  disconnectPlayer(req.params.id);
  res.json({ ok: true });
});

router.post("/move/:id", (req, res) => {
  const { x, y } = req.body;
  const player = movePlayer(req.params.id, x, y);

  res.json({ ok: true, player });
});

router.get("/online", (req, res) => {
  res.json({
    ok: true,
    players: getPlayers()
  });
});

module.exports = router;
