const express = require("express");

const router = express.Router();

let galaxyBoss = {
  name: "Galaxy Boss",
  hp: 10000,
  maxHp: 10000,
  joined: []
};

function ensureJoined(name) {
  if (!galaxyBoss.joined.includes(name)) {
    galaxyBoss.joined.push(name);
  }
}

function joinHandler(req, res) {
  const name = req.body?.name;

  if (!name) {
    return res.status(400).json({
      ok: false,
      error: "name_required"
    });
  }

  ensureJoined(name);

  return res.status(200).json({
    ok: true,
    joined: true,
    boss: galaxyBoss
  });
}

function attackHandler(req, res) {
  const name = req.body?.name;
  const damage = Number(req.body?.damage || 0);

  if (!name) {
    return res.status(400).json({
      ok: false,
      error: "name_required"
    });
  }

  ensureJoined(name);

  galaxyBoss.hp -= damage;
  if (galaxyBoss.hp < 0) galaxyBoss.hp = 0;

  return res.status(200).json({
    ok: true,
    damage,
    boss: {
      hp: galaxyBoss.hp,
      maxHp: galaxyBoss.maxHp
    }
  });
}

router.get("/boss", (req, res) => {
  return res.status(200).json({
    ok: true,
    boss: galaxyBoss
  });
});

router.post("/boss/spawn", (req, res) => {
  galaxyBoss = {
    name: "Galaxy Boss",
    hp: 10000,
    maxHp: 10000,
    joined: []
  };

  return res.status(200).json({
    ok: true,
    boss: galaxyBoss
  });
});

router.post("/join", joinHandler);
router.post("/attack", attackHandler);
router.post("/boss/join", joinHandler);
router.post("/boss/attack", attackHandler);

module.exports = router;
