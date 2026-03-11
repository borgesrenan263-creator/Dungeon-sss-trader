const express = require("express");
const router = express.Router();

const { ok, fail } = require("../../utils/api.response");
const { getPlayerByName, ensurePlayer, getAllPlayers } = require("../state/game.state");

router.post("/join", (req, res) => {

  const { name } = req.body || {};

  if (!name) {
    return fail(res, "validation_error", 400, {
      message: "name required"
    });
  }

  const player = ensurePlayer(name, name);

  player.isOnline = true;

  return ok(res, { player });

});

router.post("/logout", (req, res) => {

  const { name } = req.body || {};

  if (!name) {
    return fail(res, "validation_error", 400);
  }

  const player = getPlayerByName(name);

  if (!player) {
    return fail(res, "player_not_found", 404);
  }

  player.isOnline = false;

  return ok(res, { player });

});

router.get("/online", (req, res) => {

  const online = getAllPlayers().filter(p => p.isOnline);

  return ok(res, { online });

});

module.exports = router;
