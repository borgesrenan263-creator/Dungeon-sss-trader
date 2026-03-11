const express = require("express");
const { getPlayerByName, touchOnlinePlayer } = require("../state/game.state");

const router = express.Router();

function ensureCombatStats(player) {
  if (typeof player.hp !== "number") player.hp = 100;
  if (typeof player.maxHp !== "number") player.maxHp = 100;
  if (typeof player.pvpWins !== "number") player.pvpWins = 0;
  if (typeof player.pvpLosses !== "number") player.pvpLosses = 0;
}

function calculatePvpDamage(attacker) {
  const baseStr = attacker.attributes?.str || 10;
  const weaponRefine = attacker.equipped?.weapon?.refine || 0;
  const bonus = weaponRefine * 2;

  return Math.max(1, baseStr + bonus);
}

router.post("/attack", (req, res) => {
  const { attackerName, defenderName } = req.body || {};

  if (!attackerName || !defenderName) {
    return res.status(400).json({
      ok: false,
      error: "attackerName_defenderName_required"
    });
  }

  if (attackerName === defenderName) {
    return res.status(400).json({
      ok: false,
      error: "self_attack_not_allowed"
    });
  }

  const attacker = getPlayerByName(attackerName);
  const defender = getPlayerByName(defenderName);

  if (!attacker) {
    return res.status(404).json({
      ok: false,
      error: "attacker_not_found"
    });
  }

  if (!defender) {
    return res.status(404).json({
      ok: false,
      error: "defender_not_found"
    });
  }

  touchOnlinePlayer(attackerName);
  touchOnlinePlayer(defenderName);

  ensureCombatStats(attacker);
  ensureCombatStats(defender);

  const damage = calculatePvpDamage(attacker);

  defender.hp -= damage;
  if (defender.hp < 0) defender.hp = 0;

  let result = {
    ok: true,
    attacker: attacker.name,
    defender: defender.name,
    damage,
    defenderHp: defender.hp,
    defeated: false
  };

  if (defender.hp === 0) {
    attacker.pvpWins += 1;
    defender.pvpLosses += 1;
    result.defeated = true;
    result.winner = attacker.name;
    result.loser = defender.name;
  }

  return res.status(200).json(result);
});

router.get("/status/:name", (req, res) => {
  const player = getPlayerByName(req.params.name);

  if (!player) {
    return res.status(404).json({
      ok: false,
      error: "player_not_found"
    });
  }

  ensureCombatStats(player);

  return res.status(200).json({
    ok: true,
    pvp: {
      name: player.name,
      hp: player.hp,
      maxHp: player.maxHp,
      wins: player.pvpWins,
      losses: player.pvpLosses
    }
  });
});

module.exports = router;
