const { fail } = require("../utils/api.response");
const { extractToken, getSession } = require("../services/session.service");
const playerService = require("../services/player.service");

function requirePlayerAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return fail(res, "auth_required", 401, {
      message: "session token required"
    });
  }

  const session = getSession(token);

  if (!session) {
    return fail(res, "invalid_session", 401, {
      message: "session invalid or expired"
    });
  }

  const player = playerService.getPlayer(session.playerName);

  if (!player) {
    return fail(res, "player_not_found", 404);
  }

  req.session = session;
  req.player = player;
  req.playerName = player.name || player.nickname;

  next();
}

module.exports = {
  requirePlayerAuth
};
