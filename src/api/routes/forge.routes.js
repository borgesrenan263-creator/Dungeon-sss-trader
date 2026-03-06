const express = require("express");
const router = express.Router();

const { upgradeItem } = require("../../repositories/forge.repository");

router.post("/upgrade", async (req, res) => {

  try {

    const { inventoryId } = req.body;

    const result = await upgradeItem(inventoryId);

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
