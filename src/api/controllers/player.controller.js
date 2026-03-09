const {
  createPlayer,
  getPlayerById
} = require("../repositories/player.repository");

async function createPlayerHandler(req, res) {
  try {
    const nickname = req.body.nickname;
    const playerClass = req.body.playerClass || req.body.class;

    if (!nickname || !playerClass) {
      return res.status(400).json({
        ok: false,
        error: "nickname_or_class_missing",
        received: req.body
      });
    }

    const player = await createPlayer(nickname, playerClass);

    return res.json({
      ok: true,
      player
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "internal_error"
    });
  }
}

async function getPlayerByIdHandler(req, res) {
  try {
    const player = await getPlayerById(req.params.id);

    if (!player) {
      return res.status(404).json({
        ok: false,
        error: "player_not_found"
      });
    }

    return res.json({
      ok: true,
      player
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "internal_error"
    });
  }
}

module.exports = {
  createPlayerHandler,
  getPlayerByIdHandler
};
