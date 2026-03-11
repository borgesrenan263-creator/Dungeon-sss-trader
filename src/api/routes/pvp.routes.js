const express = require("express");
const router = express.Router();

const { ok, fail } = require("../../utils/api.response");
const { getPlayerByName } = require("../state/game.state");

router.post("/attack", (req, res) => {

  const attackerName =
    req.body.attacker ||
    req.body.attackerName;

  const defenderName =
    req.body.defender ||
    req.body.defenderName;

  const attacker = getPlayerByName(attackerName);
  const defender = getPlayerByName(defenderName);

  if (!attacker || !defender) {
    return fail(res, "player_not_found", 404);
  }

  const damage = 25;

  defender.hp = Math.max(0, (defender.hp || 100) - damage);

  let defeated = false;
  let winner = null;

  if (defender.hp === 0) {
    defeated = true;
    winner = attacker.name;

    attacker.pvp = attacker.pvp || {};
    defender.pvp = defender.pvp || {};

    attacker.pvp.wins = (attacker.pvp.wins || 0) + 1;
    defender.pvp.losses = (defender.pvp.losses || 0) + 1;
  }

  return ok(res, {
    damage,
    defeated,
    winner
  });
});

router.get("/status/:name", (req, res) => {
  const pvp = getPlayerByName(req.params.name);

  if (!pvp) {
    return fail(res, "player_not_found", 404);
  }

  return ok(res, { pvp });
});

module.exports = router;
