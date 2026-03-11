const express = require("express");

const {
  joinPlayer,
  movePlayer,
  attackPlayer,
  leavePlayer,
  getOnlinePlayers
} = require("../../engine/multiplayer_engine");

const { broadcast } = require("../../realtime/live_hub");

const router = express.Router();

router.post("/join", (req, res) => {
  const { name } = req.body;

  const player = joinPlayer(name);

  broadcast("player:join", player);

  res.json({
    ok: true,
    player
  });
});

router.post("/move", (req, res) => {
  const { name, dx, dy } = req.body;

  const player = movePlayer(name, dx, dy);

  broadcast("player:move", player);

  res.json({
    ok: true,
    player
  });
});

router.post("/attack", (req, res) => {
  const { attacker, target } = req.body;

  const result = attackPlayer(attacker, target);

  broadcast("player:attack", result);

  res.json({
    ok: true,
    combat: result
  });
});

router.post("/leave", (req, res) => {
  const { name } = req.body;

  leavePlayer(name);

  broadcast("player:leave", { name });

  res.json({
    ok: true
  });
});

router.get("/online", (req, res) => {
  res.json({
    ok: true,
    players: getOnlinePlayers()
  });
});

module.exports = router;
