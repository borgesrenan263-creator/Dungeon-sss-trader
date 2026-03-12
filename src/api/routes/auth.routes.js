const express = require("express");
const router = express.Router();

const { ok, fail } = require("../../utils/api.response");
const playerService = require("../../services/player.service");
const {
  createSession,
  revokeSession,
  revokePlayerSessions
} = require("../../services/session.service");
const { requirePlayerAuth } = require("../../middlewares/auth_player.middleware");

/*
POST /auth/login
Body:
{
  "name": "Hero"
}
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
  const session = createSession(player.name || player.nickname);

  return ok(res, {
    player,
    session: {
      token: session.token,
      expiresAt: session.expiresAt
    }
  });
});

/*
GET /auth/me
Authorization: Bearer <token>
*/
router.get("/me", requirePlayerAuth, (req, res) => {
  return ok(res, {
    player: req.player,
    session: {
      token: req.session.token,
      expiresAt: req.session.expiresAt
    }
  });
});

/*
POST /auth/logout
Authorization: Bearer <token>
*/
router.post("/logout", requirePlayerAuth, (req, res) => {
  revokeSession(req.session.token);
  playerService.logoutPlayer(req.player.name || req.player.nickname);

  return ok(res, {
    loggedOut: true,
    player: req.player
  });
});

/*
POST /auth/logout-all
Body:
{
  "name": "Hero"
}
*/
router.post("/logout-all", (req, res) => {
  const body = req.body || {};
  const name = body.name || body.nickname;

  if (!name) {
    return fail(res, "validation_error", 400, {
      message: "name or nickname required"
    });
  }

  const removed = revokePlayerSessions(name);
  const player = playerService.logoutPlayer(name);

  return ok(res, {
    removedSessions: removed,
    player
  });
});

module.exports = router;
