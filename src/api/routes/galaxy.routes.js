const express = require("express");
const {
  joinGalaxy,
  attackGalaxy,
  getGalaxyState
} = require("../state/game.state");

const router = express.Router();

router.get("/state", (req, res) => {
  return res.json({
    ok: true,
    boss: getGalaxyState()
  });
});

router.post("/join", (req, res) => {
  const { name } = req.body || {};

  if (!name) {
    return res.status(400).json({ ok: false, error: "name_required" });
  }

  const joined = joinGalaxy(name);

  if (!joined.ok) {
    return res.status(400).json(joined);
  }

  return res.json(joined);
});

router.post("/attack", (req, res) => {
  const { name, damage } = req.body || {};

  if (!name) {
    return res.status(400).json({ ok: false, error: "name_required" });
  }

  const numericDamage = Number(damage || 100);

  const attacked = attackGalaxy(name, numericDamage);

  if (!attacked.ok) {
    return res.status(400).json(attacked);
  }

  return res.json(attacked);
});

module.exports = router;
