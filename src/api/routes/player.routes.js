const express = require("express");
const router = express.Router();

const { ok, fail } = require("../../utils/api.response");
const playerService = require("../../services/player.service");

/*
POST /player/create
*/
router.post("/create", (req, res) => {
  const body = req.body || {};
  const name = body.name || body.nickname;
  const nickname = body.nickname || body.name;

  if (!name) {
    return fail(res, "validation_error", 400, {
      message: "name or nickname required"
    });
  }

  const player = playerService.createPlayer(name, nickname);

  return ok(res, { player });
});

/*
GET /player/online
*/
router.get("/online", (req, res) => {
  const online = playerService.getOnlinePlayers();
  return ok(res, { online });
});

/*
POST /player/login
*/
router.post("/login", (req, res) => {
  const body = req.body || {};
  const name = body.name || body.nickname;
  const nickname = body.nickname || body.name;

  if (!name) {
    return fail(res, "validation_error", 400, {
      message: "name or nickname required"
    });
  }

  const player = playerService.loginPlayer(name, nickname);

  return ok(res, { player });
});

/*
POST /player/logout
*/
router.post("/logout", (req, res) => {
  const body = req.body || {};
  const name = body.name || body.nickname;

  if (!name) {
    return fail(res, "validation_error", 400, {
      message: "name or nickname required"
    });
  }

  const player = playerService.logoutPlayer(name);

  if (!player) {
    return fail(res, "player_not_found", 404);
  }

  return ok(res, { player });
});

/*
GET /player/:name/status
*/
router.get("/:name/status", (req, res) => {
  const player = playerService.getPlayerStatus(req.params.name);

  if (!player) {
    return fail(res, "player_not_found", 404);
  }

  return ok(res, { status: player });
});

/*
POST /player/:name/move-sector
*/
router.post("/:name/move-sector", (req, res) => {
  const { sector } = req.body || {};

  if (typeof sector !== "number") {
    return fail(res, "validation_error", 400, {
      message: "sector must be numeric"
    });
  }

  const player = playerService.movePlayerSector(req.params.name, sector);

  if (!player) {
    return fail(res, "player_not_found", 404);
  }

  return ok(res, {
    moved: {
      moved: {
        sector: player.sector
      }
    },
    player
  });
});

/*
GET /player/:name
*/
router.get("/:name", (req, res) => {
  const player = playerService.getPlayer(req.params.name);

  if (!player) {
    return fail(res, "player_not_found", 404);
  }

  return ok(res, {
    profile: {
      player
    },
    player
  });
});

module.exports = router;
