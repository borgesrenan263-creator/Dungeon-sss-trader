const { initDB, saveDB } = require("../config/database");

const FORGE_TABLE = {
  0: { chance: 90, destroy: false },
  1: { chance: 60, destroy: false },
  2: { chance: 40, destroy: false },
  3: { chance: 15, destroy: true },
  4: { chance: 5, destroy: true }
};

function rollSuccess(chance) {
  return Math.random() * 100 <= chance;
}

async function upgradeItem(inventoryId) {
  const db = await initDB();

  const inv = db.exec(
    `SELECT id, player_id, item_id, upgrade_level
     FROM inventory
     WHERE id = ?`,
    [Number(inventoryId)]
  );

  if (!inv.length || !inv[0].values.length) {
    throw new Error("item not found in inventory");
  }

  const row = inv[0].values[0];

  const currentLevel = row[3];

  if (currentLevel >= 5) {
    throw new Error("item already max level");
  }

  const rule = FORGE_TABLE[currentLevel];

  const success = rollSuccess(rule.chance);

  if (success) {

    const newLevel = currentLevel + 1;

    db.run(
      `UPDATE inventory
       SET upgrade_level = ?
       WHERE id = ?`,
      [newLevel, Number(inventoryId)]
    );

    saveDB();

    return {
      success: true,
      old_level: currentLevel,
      new_level: newLevel
    };

  } else {

    if (rule.destroy) {

      db.run(
        `DELETE FROM inventory
         WHERE id = ?`,
        [Number(inventoryId)]
      );

      saveDB();

      return {
        success: false,
        destroyed: true,
        level: currentLevel
      };

    } else {

      db.run(
        `UPDATE inventory
         SET upgrade_level = 0
         WHERE id = ?`,
        [Number(inventoryId)]
      );

      saveDB();

      return {
        success: false,
        destroyed: false,
        reset_to: 0
      };

    }

  }
}

module.exports = {
  upgradeItem
};
