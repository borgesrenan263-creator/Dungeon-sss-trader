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

async function ensureForgeTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS forge_support (
      player_id INTEGER PRIMARY KEY,
      stability_stones INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS forge_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      inventory_id INTEGER NOT NULL,
      old_level INTEGER NOT NULL,
      success INTEGER NOT NULL,
      destroyed INTEGER DEFAULT 0,
      used_stability_stone INTEGER DEFAULT 0,
      new_level INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveDB();
}

async function ensurePlayerForgeSupport(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT player_id
     FROM forge_support
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    db.run(
      `INSERT INTO forge_support (player_id, stability_stones)
       VALUES (?, 0);`,
      [Number(playerId)]
    );

    saveDB();
  }
}

async function buyStabilityStone(playerId) {
  const db = await initDB();

  await ensurePlayerForgeSupport(playerId);

  const walletResult = db.exec(
    `SELECT obsidian
     FROM currencies
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  if (!walletResult.length || !walletResult[0].values.length) {
    throw new Error("player wallet not found");
  }

  const obsidian = Number(walletResult[0].values[0][0] || 0);

  if (obsidian < 1) {
    throw new Error("not enough obsidian");
  }

  db.run(
    `UPDATE currencies
     SET obsidian = obsidian - 1
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  db.run(
    `UPDATE forge_support
     SET stability_stones = stability_stones + 1
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    bought: 1,
    cost_obsidian: 1
  };
}

async function getForgeSupport(playerId) {
  const db = await initDB();

  await ensurePlayerForgeSupport(playerId);

  const result = db.exec(
    `SELECT player_id, stability_stones
     FROM forge_support
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    return {
      player_id: Number(playerId),
      stability_stones: 0
    };
  }

  const row = result[0].values[0];

  return {
    player_id: row[0],
    stability_stones: row[1]
  };
}

async function upgradeItem(inventoryId, useStabilityStone = false) {
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
  const inventoryRowId = Number(row[0]);
  const playerId = Number(row[1]);
  const currentLevel = Number(row[3]);

  if (currentLevel >= 5) {
    throw new Error("item already max level");
  }

  await ensurePlayerForgeSupport(playerId);

  let stabilityStoneUsed = false;

  if (useStabilityStone) {
    const supportResult = db.exec(
      `SELECT stability_stones
       FROM forge_support
       WHERE player_id = ?;`,
      [playerId]
    );

    const currentStones = Number(supportResult[0]?.values?.[0]?.[0] || 0);

    if (currentStones <= 0) {
      throw new Error("no stability stones available");
    }

    db.run(
      `UPDATE forge_support
       SET stability_stones = stability_stones - 1
       WHERE player_id = ?;`,
      [playerId]
    );

    stabilityStoneUsed = true;
  }

  const rule = FORGE_TABLE[currentLevel];
  const success = rollSuccess(rule.chance);

  if (success) {
    const newLevel = currentLevel + 1;

    db.run(
      `UPDATE inventory
       SET upgrade_level = ?
       WHERE id = ?`,
      [newLevel, inventoryRowId]
    );

    db.run(
      `INSERT INTO forge_logs (
        player_id,
        inventory_id,
        old_level,
        success,
        destroyed,
        used_stability_stone,
        new_level
      ) VALUES (?, ?, ?, 1, 0, ?, ?);`,
      [playerId, inventoryRowId, currentLevel, stabilityStoneUsed ? 1 : 0, newLevel]
    );

    saveDB();

    return {
      success: true,
      old_level: currentLevel,
      new_level: newLevel,
      used_stability_stone: stabilityStoneUsed
    };
  }

  if (rule.destroy) {
    if (stabilityStoneUsed) {
      db.run(
        `INSERT INTO forge_logs (
          player_id,
          inventory_id,
          old_level,
          success,
          destroyed,
          used_stability_stone,
          new_level
        ) VALUES (?, ?, ?, 0, 0, 1, ?);`,
        [playerId, inventoryRowId, currentLevel, currentLevel]
      );

      saveDB();

      return {
        success: false,
        destroyed: false,
        protected_by_stability_stone: true,
        level: currentLevel
      };
    }

    db.run(
      `DELETE FROM inventory
       WHERE id = ?`,
      [inventoryRowId]
    );

    db.run(
      `INSERT INTO forge_logs (
        player_id,
        inventory_id,
        old_level,
        success,
        destroyed,
        used_stability_stone,
        new_level
      ) VALUES (?, ?, ?, 0, 1, 0, NULL);`,
      [playerId, inventoryRowId, currentLevel]
    );

    saveDB();

    return {
      success: false,
      destroyed: true,
      level: currentLevel
    };
  }

  db.run(
    `UPDATE inventory
     SET upgrade_level = 0
     WHERE id = ?`,
    [inventoryRowId]
  );

  db.run(
    `INSERT INTO forge_logs (
      player_id,
      inventory_id,
      old_level,
      success,
      destroyed,
      used_stability_stone,
      new_level
    ) VALUES (?, ?, ?, 0, 0, ?, 0);`,
    [playerId, inventoryRowId, currentLevel, stabilityStoneUsed ? 1 : 0]
  );

  saveDB();

  return {
    success: false,
    destroyed: false,
    reset_to: 0,
    used_stability_stone: stabilityStoneUsed
  };
}

async function getForgeLogs(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id,
            player_id,
            inventory_id,
            old_level,
            success,
            destroyed,
            used_stability_stone,
            new_level,
            created_at
     FROM forge_logs
     WHERE player_id = ?
     ORDER BY id DESC;`,
    [Number(playerId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    player_id: row[1],
    inventory_id: row[2],
    old_level: row[3],
    success: Boolean(row[4]),
    destroyed: Boolean(row[5]),
    used_stability_stone: Boolean(row[6]),
    new_level: row[7],
    created_at: row[8]
  }));
}

module.exports = {
  ensureForgeTables,
  buyStabilityStone,
  getForgeSupport,
  upgradeItem,
  getForgeLogs
};
