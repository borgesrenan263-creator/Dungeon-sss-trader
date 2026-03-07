const express = require("express");
const router = express.Router();

const {
  COLLECTOR_PET_PRICE_OBSIDIAN,
  buyCollectorPet,
  getPlayerPets
} = require("../../repositories/pets.repository");

router.get("/prices", async (req, res) => {
  try {
    return res.json({
      ok: true,
      prices: {
        collector_pet_obsidian: COLLECTOR_PET_PRICE_OBSIDIAN
      }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/collector/buy", async (req, res) => {
  try {
    const { playerId } = req.body;

    const result = await buyCollectorPet(playerId);

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

router.get("/:playerId", async (req, res) => {
  try {
    const pets = await getPlayerPets(req.params.playerId);

    return res.json({
      ok: true,
      total: pets.length,
      pets
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
