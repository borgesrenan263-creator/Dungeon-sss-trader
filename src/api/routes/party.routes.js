const express = require("express");
const router = express.Router();

const {
  createParty,
  inviteToParty,
  acceptPartyInvite,
  getPartyDetailsByPlayer,
  leaveParty,
  kickPartyMember
} = require("../../repositories/party.repository");

router.post("/create", async (req, res) => {
  try {
    const { leaderPlayerId } = req.body;

    const result = await createParty({
      leaderPlayerId
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

router.post("/invite", async (req, res) => {
  try {
    const { partyId, fromPlayerId, toPlayerId } = req.body;

    const result = await inviteToParty({
      partyId,
      fromPlayerId,
      toPlayerId
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

router.post("/accept", async (req, res) => {
  try {
    const { inviteId, playerId } = req.body;

    const result = await acceptPartyInvite({
      inviteId,
      playerId
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

router.post("/leave", async (req, res) => {
  try {
    const { playerId } = req.body;

    const result = await leaveParty({
      playerId
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

router.post("/kick", async (req, res) => {
  try {
    const { actorPlayerId, targetPlayerId } = req.body;

    const result = await kickPartyMember({
      actorPlayerId,
      targetPlayerId
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

router.get("/player/:playerId", async (req, res) => {
  try {
    const result = await getPartyDetailsByPlayer(req.params.playerId);

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
