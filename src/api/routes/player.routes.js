const express = require("express");
const router = express.Router();

const { ok, fail } = require("../../utils/api.response");
const { getPlayerByName, ensurePlayer, getAllPlayers } = require("../state/game.state");

/*
POST /player/create
Aceita:
- { name: "Hero" }
- { nickname: "Hero" }
- { name: "Hero", nickname: "HeroNick" }
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

  const player = ensurePlayer(name, nickname);

  return ok(res, { player });
});

/*
GET /player/:name
*/
router.get("/online", (req, res) => {
  const online = getAllPlayers().filter((p) => p.isOnline);
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

  const player = ensurePlayer(name, nickname);
  player.isOnline = true;

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

  const player = ensurePlayer(name, name);
  player.isOnline = false;

  return ok(res, { player });
});

/*
GET /player/:name/status
*/
router.get("/:name/status", (req, res) => {
  const player = getPlayerByName(req.params.name);

  if (!player) {
    return fail(res, "player_not_found", 404);
  }

  return ok(res, { status: player });
});

/*
POST /player/:name/move-sector
*/
router.post("/:name/move-sector", (req, res) => {
  const player = getPlayerByName(req.params.name);

  if (!player) {
    return fail(res, "player_not_found", 404);
  }

  const { sector } = req.body || {};

  if (typeof sector !== "number") {
    return fail(res, "validation_error", 400, {
      message: "sector must be numeric"
    });
  }

  player.sector = sector;

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
deixa por último para não capturar /online antes
*/
router.get("/:name", (req, res) => {
  const player = getPlayerByName(req.params.name);

  if (!player) {
    return fail(res, "player_not_found", 404);
  }

  return ok(res, {
    profile: {
      player
    }
  });
});

module.exports = router;
