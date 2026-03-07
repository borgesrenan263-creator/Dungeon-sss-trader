const express = require("express");
const router = express.Router();

const {
  listSkillsByClass,
  getPlayerSkills,
  learnSkill,
  equipSkill,
  castSkill
} = require("../../repositories/skills.repository");

router.get("/list/:className", async (req, res) => {
  try {
    const skills = await listSkillsByClass(req.params.className);

    res.json({
      ok: true,
      total: skills.length,
      skills
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/player/:playerId", async (req, res) => {
  try {
    const result = await getPlayerSkills(req.params.playerId);

    res.json({
      ok: true,
      result
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/learn", async (req, res) => {
  try {
    const { playerId, skillId } = req.body;

    const result = await learnSkill({
      playerId,
      skillId
    });

    res.json({
      ok: true,
      result
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/equip", async (req, res) => {
  try {
    const { playerId, skillId, slotNumber } = req.body;

    const result = await equipSkill({
      playerId,
      skillId,
      slotNumber
    });

    res.json({
      ok: true,
      result
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/cast", async (req, res) => {
  try {
    const { playerId, skillId } = req.body;

    const result = await castSkill({
      playerId,
      skillId
    });

    res.json({
      ok: true,
      result
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
