const express = require("express");
const {
  createPlayerProfile,
  getPlayerProfile,
  movePlayerSector,
  loginPlayer,
  logoutPlayer,
  getOnlinePlayers
} = require("../state/game.state");

const router = express.Router();

router.post("/create", (req, res) => {
  const created = createPlayerProfile(req.body || {});

  return res.status(200).json({
    ok: true,
    player: created.player,
    sector: created.sector
  });
});

router.post("/login", (req, res) => {
  const logged = loginPlayer(req.body || {});

  return res.status(200).json(logged);
});

router.post("/logout", (req, res) => {
  const { name } = req.body || {};
  const loggedOut = logoutPlayer(name);

  if (!loggedOut.ok) {
    return res.status(404).json(loggedOut);
  }

  return res.status(200).json(loggedOut);
});

router.get("/online", (req, res) => {
  return res.status(200).json({
    ok: true,
    online: getOnlinePlayers()
  });
});

router.get("/:name/status", (req, res) => {
  const profile = getPlayerProfile(req.params.name);

  if (!profile) {
    return res.status(404).json({
      ok: false,
      error: "player_not_found"
    });
  }

  return res.status(200).json({
    ok: true,
    status: {
      name: profile.player.name,
      nickname: profile.player.nickname,
      hp: profile.player.hp,
      maxHp: profile.player.maxHp,
      gold: profile.player.gold,
      level: profile.player.level || 1,
      isOnline: profile.player.isOnline || false,
      lastSeen: profile.player.lastSeen,
      sector: profile.sector.sector
    }
  });
});

router.get("/:name", (req, res) => {
  const profile = getPlayerProfile(req.params.name);

  if (!profile) {
    return res.status(404).json({
      ok: false,
      error: "player_not_found"
    });
  }

  return res.status(200).json({
    ok: true,
    profile
  });
});

router.post("/:name/move-sector", (req, res) => {
  const sector = Number(req.body?.sector || 1);
  const moved = movePlayerSector(req.params.name, sector);

  if (!moved.ok) {
    return res.status(404).json(moved);
  }

  return res.status(200).json({
    ok: true,
    moved
  });
});

module.exports = router;
