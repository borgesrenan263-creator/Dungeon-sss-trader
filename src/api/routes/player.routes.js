const express = require("express");

const {
  createPlayerHandler,
  getPlayerByIdHandler
} = require("../controllers/player.controller");

const router = express.Router();

router.post("/create", createPlayerHandler);

router.get("/:id", getPlayerByIdHandler);

module.exports = router;
