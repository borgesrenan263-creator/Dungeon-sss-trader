const express = require("express");
const router = express.Router();

const {
  getSectorSpawnPool,
  rollSectorMonster
} = require("../../repositories/spawn.repository");

router.get("/sector/:sectorId", async (req, res) => {
  try {
    const monsters = await getSectorSpawnPool(req.params.sectorId);

    return res.json({
      ok: true,
      total: monsters.length,
      monsters
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/roll", async (req, res) => {
  try {
    const { sectorId } = req.body;

    const result = await rollSectorMonster(sectorId);

    return res.json({
      ok: true,
      result
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
