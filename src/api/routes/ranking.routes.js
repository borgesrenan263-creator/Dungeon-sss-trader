const express = require("express");
const router = express.Router();

const {
  getTopPlayers,
  getPlayerRank
} = require("../../repositories/ranking.repository");

router.get("/top10", async (req, res) => {

  try {

    const ranking = await getTopPlayers();

    return res.json({
      ok: true,
      total: ranking.length,
      ranking
    });

  } catch (error) {

    return res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

router.get("/player/:id", async (req, res) => {

  try {

    const playerRank = await getPlayerRank(req.params.id);

    return res.json({
      ok: true,
      rank: playerRank
    });

  } catch (error) {

    return res.status(500).json({
      ok: false,
      error: error.message
    });

  }

});

module.exports = router;
