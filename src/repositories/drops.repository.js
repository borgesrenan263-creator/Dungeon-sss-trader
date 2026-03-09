const { initDB, saveDB } = require("../config/database");

const MONSTER_DROP_SEED = [
  { monster_key: "shadow_slime", item_id: 1, rarity: "Common", drop_chance: 60, min_amount: 1, max_amount: 1 },
  { monster_key: "shadow_slime", item_id: 2, rarity: "Uncommon", drop_chance: 20, min_amount: 1, max_amount: 1 },
  { monster_key: "forest_wolf", item_id: 1, rarity: "Common", drop_chance: 55, min_amount: 1, max_amount: 1 },
  { monster_key: "forest_wolf", item_id: 2, rarity: "Uncommon", drop_chance: 25, min_amount: 1, max_amount: 1 },
  { monster_key: "rookie_goblin", item_id: 1, rarity: "Common", drop_chance: 50, min_amount: 1, max_amount: 1 },
  { monster_key: "rookie_goblin", item_id: 3, rarity: "Rare", drop_chance: 10, min_amount: 1, max_amount: 1 }
];

const DUNGEON_DROP_SEED = [
  { dungeon_id: 1, loot_name: "Shadow Core", rarity: "Rare", drop_chance: 35, min_amount: 1, max_amount: 1, gold_bonus: 150 },
  { dungeon_id: 1, loot_name: "Dungeon Iron Chest", rarity: "Epic", drop_chance: 12, min_amount: 1, max_amount: 1, gold_bonus: 250 },
  { dungeon_id: 2, loot_name: "Ancient Rune Fragment", rarity: "Epic", drop_chance: 10, min_amount: 1, max_amount: 1, gold_bonus: 350 }
];

const BOSS_DROP_SEED = [
  { boss_name: "Galaxy Devourer", loot_name: "Galaxy Rune", rarity: "Galaxy", drop_chance: 100, min_amount: 1, max_amount: 1, gold_bonus: 1000 },
  { boss_name: "Galaxy Devourer", loot_name: "Astral Core", rarity: "Legendary", drop_chance: 45, min_amount: 1, max_amount: 2, gold_bonus: 450 }
];

function randomInt(min, max) {
  const safeMin = Number(min);
  const safeMax = Number(max);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

function rollChance(chancePercent) {
  return Math.random() * 100 <= Number(chancePercent);
}

async function ensureDropsTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS drop_tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monster_key TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      rarity TEXT NOT NULL,
      drop_chance REAL NOT NULL,
      min_amount INTEGER DEFAULT 1,
      max_amount INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dungeon_drop_tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dungeon_id INTEGER NOT NULL,
      loot_name TEXT NOT NULL,
      rarity TEXT NOT NULL,
      drop_chance REAL NOT NULL,
      min_amount INTEGER DEFAULT 1,
      max_amount INTEGER DEFAULT 1,
      gold_bonus INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS boss_drop_tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boss_name TEXT NOT NULL,
      loot_name TEXT NOT NULL,
      rarity TEXT NOT NULL,
      drop_chance REAL NOT NULL,
      min_amount INTEGER DEFAULT 1,
      max_amount INTEGER DEFAULT 1,
      gold_bonus INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS player_drop_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      source_type TEXT NOT NULL,
      source_id INTEGER,
      loot_name TEXT NOT NULL,
      rarity TEXT NOT NULL,
      amount INTEGER DEFAULT 1,
      gold_bonus INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function seedDropTables() {
  const db = await initDB();

  for (const drop of MONSTER_DROP_SEED) {
    const existing = db.exec(
      `SELECT id
       FROM drop_tables
       WHERE monster_key = ?
         AND item_id = ?`,
      [drop.monster_key, Number(drop.item_id)]
    );

    if (existing.length && existing[0].values.length) continue;

    db.run(
      `INSERT INTO drop_tables (
        monster_key,
        item_id,
        rarity,
        drop_chance,
        min_amount,
        max_amount
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(drop.monster_key),
        Number(drop.item_id),
        String(drop.rarity),
        Number(drop.drop_chance),
        Number(drop.min_amount),
        Number(drop.max_amount)
      ]
    );
  }

  for (const drop of DUNGEON_DROP_SEED) {
    const existing = db.exec(
      `SELECT id
       FROM dungeon_drop_tables
       WHERE dungeon_id = ?
         AND loot_name = ?`,
      [Number(drop.dungeon_id), String(drop.loot_name)]
    );

    if (existing.length && existing[0].values.length) continue;

    db.run(
      `INSERT INTO dungeon_drop_tables (
        dungeon_id,
        loot_name,
        rarity,
        drop_chance,
        min_amount,
        max_amount,
        gold_bonus
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(drop.dungeon_id),
        String(drop.loot_name),
        String(drop.rarity),
        Number(drop.drop_chance),
        Number(drop.min_amount),
        Number(drop.max_amount),
        Number(drop.gold_bonus)
      ]
    );
  }

  for (const drop of BOSS_DROP_SEED) {
    const existing = db.exec(
      `SELECT id
       FROM boss_drop_tables
       WHERE boss_name = ?
         AND loot_name = ?`,
      [String(drop.boss_name), String(drop.loot_name)]
    );

    if (existing.length && existing[0].values.length) continue;

    db.run(
      `INSERT INTO boss_drop_tables (
        boss_name,
        loot_name,
        rarity,
        drop_chance,
        min_amount,
        max_amount,
        gold_bonus
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        String(drop.boss_name),
        String(drop.loot_name),
        String(drop.rarity),
        Number(drop.drop_chance),
        Number(drop.min_amount),
        Number(drop.max_amount),
        Number(drop.gold_bonus)
      ]
    );
  }

  saveDB();
}

async function getMonsterDropTable(monsterId) {
  const db = await initDB();

  const monsterResult = db.exec(
    `SELECT id, name, monster_key
     FROM monsters
     WHERE id = ?`,
    [Number(monsterId)]
  );

  if (!monsterResult.length || !monsterResult[0].values.length) {
    throw new Error("monster not found");
  }

  const monster = monsterResult[0].values[0];
  const monsterKey = monster[2];

  if (!monsterKey) {
    throw new Error("monster_key not configured for this monster");
  }

  const result = db.exec(
    `SELECT dt.id, dt.monster_key, dt.item_id, i.name, dt.rarity, dt.drop_chance, dt.min_amount, dt.max_amount
     FROM drop_tables dt
     INNER JOIN items i ON i.id = dt.item_id
     WHERE dt.monster_key = ?
     ORDER BY dt.drop_chance DESC, dt.id ASC`,
    [String(monsterKey)]
  );

  if (!result.length) {
    return {
      monster_id: Number(monster[0]),
      monster_name: monster[1],
      monster_key: monsterKey,
      drops: []
    };
  }

  return {
    monster_id: Number(monster[0]),
    monster_name: monster[1],
    monster_key: monsterKey,
    drops: result[0].values.map((row) => ({
      drop_id: row[0],
      monster_key: row[1],
      item_id: row[2],
      item_name: row[3],
      rarity: row[4],
      drop_chance: row[5],
      min_amount: row[6],
      max_amount: row[7]
    }))
  };
}

async function getDungeonDropTable(dungeonId) {
  const db = await initDB();

  const dungeonResult = db.exec(
    `SELECT id, dungeon_name
     FROM dungeons
     WHERE id = ?`,
    [Number(dungeonId)]
  );

  if (!dungeonResult.length || !dungeonResult[0].values.length) {
    throw new Error("dungeon not found");
  }

  const dungeon = dungeonResult[0].values[0];

  const result = db.exec(
    `SELECT id, loot_name, rarity, drop_chance, min_amount, max_amount, gold_bonus
     FROM dungeon_drop_tables
     WHERE dungeon_id = ?
     ORDER BY drop_chance DESC, id ASC`,
    [Number(dungeonId)]
  );

  return {
    dungeon_id: Number(dungeon[0]),
    dungeon_name: dungeon[1],
    drops: !result.length ? [] : result[0].values.map((row) => ({
      drop_id: row[0],
      loot_name: row[1],
      rarity: row[2],
      drop_chance: row[3],
      min_amount: row[4],
      max_amount: row[5],
      gold_bonus: row[6]
    }))
  };
}

async function getBossDropTable(bossId) {
  const db = await initDB();

  const bossResult = db.exec(
    `SELECT id, boss_name, status
     FROM world_bosses
     WHERE id = ?`,
    [Number(bossId)]
  );

  if (!bossResult.length || !bossResult[0].values.length) {
    throw new Error("boss not found");
  }

  const boss = bossResult[0].values[0];

  const result = db.exec(
    `SELECT id, boss_name, loot_name, rarity, drop_chance, min_amount, max_amount, gold_bonus
     FROM boss_drop_tables
     WHERE boss_name = ?
     ORDER BY drop_chance DESC, id ASC`,
    [String(boss[1])]
  );

  return {
    boss_id: Number(boss[0]),
    boss_name: boss[1],
    status: boss[2],
    drops: !result.length ? [] : result[0].values.map((row) => ({
      drop_id: row[0],
      boss_name: row[1],
      loot_name: row[2],
      rarity: row[3],
      drop_chance: row[4],
      min_amount: row[5],
      max_amount: row[6],
      gold_bonus: row[7]
    }))
  };
}

async function logPlayerDrop({ playerId, sourceType, sourceId, lootName, rarity, amount, goldBonus }) {
  const db = await initDB();

  db.run(
    `INSERT INTO player_drop_log (
      player_id,
      source_type,
      source_id,
      loot_name,
      rarity,
      amount,
      gold_bonus,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      Number(playerId),
      String(sourceType),
      sourceId == null ? null : Number(sourceId),
      String(lootName),
      String(rarity),
      Number(amount),
      Number(goldBonus || 0)
    ]
  );

  saveDB();
}

async function addGold(playerId, amount) {
  const db = await initDB();

  db.run(
    `UPDATE currencies
     SET gold = gold + ?
     WHERE player_id = ?`,
    [Number(amount), Number(playerId)]
  );

  saveDB();
}

async function addItemToInventoryByItemId(playerId, itemId, amount) {
  const db = await initDB();

  for (let i = 0; i < Number(amount); i += 1) {
    db.run(
      `INSERT INTO inventory (
        player_id,
        item_id,
        upgrade_level,
        equipped
      ) VALUES (?, ?, 0, 0)`,
      [Number(playerId), Number(itemId)]
    );
  }

  saveDB();
}

async function getMonsterDominationBonus(monsterId) {
  const db = await initDB();

  const monsterResult = db.exec(
    `SELECT sector
     FROM monsters
     WHERE id = ?`,
    [Number(monsterId)]
  );

  if (!monsterResult.length || !monsterResult[0].values.length) {
    return 0;
  }

  const sectorId = Number(monsterResult[0].values[0][0]);

  const domination = db.exec(
    `SELECT drop_bonus_percent
     FROM sector_domination
     WHERE sector_id = ?`,
    [sectorId]
  );

  if (!domination.length || !domination[0].values.length) {
    return 0;
  }

  return Number(domination[0].values[0][0] || 0);
}

async function rollMonsterDrop({ playerId, monsterId, partyBonus = 0 }) {
  const table = await getMonsterDropTable(monsterId);

  if (!table.drops.length) {
    return {
      player_id: Number(playerId),
      monster_id: Number(monsterId),
      dropped: false,
      rewards: []
    };
  }

  const dominationBonus = await getMonsterDominationBonus(monsterId);
  const totalBonus = Number(partyBonus || 0) + Number(dominationBonus || 0);

  const rewards = [];

  for (const drop of table.drops) {
    const effectiveChance = Number(drop.drop_chance) + totalBonus;

    if (!rollChance(effectiveChance)) continue;

    const amount = randomInt(drop.min_amount, drop.max_amount);

    await addItemToInventoryByItemId(playerId, drop.item_id, amount);

    await logPlayerDrop({
      playerId,
      sourceType: "monster",
      sourceId: monsterId,
      lootName: drop.item_name,
      rarity: drop.rarity,
      amount,
      goldBonus: 0
    });

    rewards.push({
      loot_type: "item",
      item_id: drop.item_id,
      loot_name: drop.item_name,
      rarity: drop.rarity,
      amount,
      effective_chance: effectiveChance
    });
  }

  return {
    player_id: Number(playerId),
    monster_id: Number(monsterId),
    total_bonus_percent: totalBonus,
    dropped: rewards.length > 0,
    rewards
  };
}

async function rollDungeonDrop({ playerId, dungeonId, partyBonus = 0 }) {
  const table = await getDungeonDropTable(dungeonId);

  if (!table.drops.length) {
    return {
      player_id: Number(playerId),
      dungeon_id: Number(dungeonId),
      dropped: false,
      rewards: []
    };
  }

  const rewards = [];

  for (const drop of table.drops) {
    const effectiveChance = Number(drop.drop_chance) + Number(partyBonus || 0);

    if (!rollChance(effectiveChance)) continue;

    const amount = randomInt(drop.min_amount, drop.max_amount);
    const goldBonus = Number(drop.gold_bonus || 0);

    if (goldBonus > 0) {
      await addGold(playerId, goldBonus);
    }

    await logPlayerDrop({
      playerId,
      sourceType: "dungeon",
      sourceId: dungeonId,
      lootName: drop.loot_name,
      rarity: drop.rarity,
      amount,
      goldBonus
    });

    rewards.push({
      loot_type: "dungeon_reward",
      loot_name: drop.loot_name,
      rarity: drop.rarity,
      amount,
      gold_bonus: goldBonus,
      effective_chance: effectiveChance
    });
  }

  return {
    player_id: Number(playerId),
    dungeon_id: Number(dungeonId),
    total_bonus_percent: Number(partyBonus || 0),
    dropped: rewards.length > 0,
    rewards
  };
}

async function rollBossDrop({ playerId, bossId, bossBonus = 0 }) {
  const table = await getBossDropTable(bossId);

  if (!table.drops.length) {
    return {
      player_id: Number(playerId),
      boss_id: Number(bossId),
      dropped: false,
      rewards: []
    };
  }

  const rewards = [];

  for (const drop of table.drops) {
    const effectiveChance = Number(drop.drop_chance) + Number(bossBonus || 0);

    if (!rollChance(effectiveChance)) continue;

    const amount = randomInt(drop.min_amount, drop.max_amount);
    const goldBonus = Number(drop.gold_bonus || 0);

    if (goldBonus > 0) {
      await addGold(playerId, goldBonus);
    }

    await logPlayerDrop({
      playerId,
      sourceType: "boss",
      sourceId: bossId,
      lootName: drop.loot_name,
      rarity: drop.rarity,
      amount,
      goldBonus
    });

    rewards.push({
      loot_type: "boss_reward",
      loot_name: drop.loot_name,
      rarity: drop.rarity,
      amount,
      gold_bonus: goldBonus,
      effective_chance: effectiveChance
    });
  }

  return {
    player_id: Number(playerId),
    boss_id: Number(bossId),
    total_bonus_percent: Number(bossBonus || 0),
    dropped: rewards.length > 0,
    rewards
  };
}

async function getPlayerDropLog(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, player_id, source_type, source_id, loot_name, rarity, amount, gold_bonus, created_at
     FROM player_drop_log
     WHERE player_id = ?
     ORDER BY id DESC`,
    [Number(playerId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    drop_log_id: row[0],
    player_id: row[1],
    source_type: row[2],
    source_id: row[3],
    loot_name: row[4],
    rarity: row[5],
    amount: row[6],
    gold_bonus: row[7],
    created_at: row[8]
  }));
}

module.exports = {
  ensureDropsTables,
  seedDropTables,
  getMonsterDropTable,
  getDungeonDropTable,
  getBossDropTable,
  rollMonsterDrop,
  rollDungeonDrop,
  rollBossDrop,
  getPlayerDropLog
};
