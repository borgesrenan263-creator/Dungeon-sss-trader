const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

async function ensureRaidTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS world_bosses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boss_name TEXT NOT NULL,
      max_hp INTEGER NOT NULL,
      current_hp INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      reward_name TEXT DEFAULT 'Galaxy Rune',
      winner_player_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS boss_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boss_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      total_damage INTEGER DEFAULT 0,
      reward_claimed INTEGER DEFAULT 0,
      UNIQUE(boss_id, player_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS boss_damage_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boss_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      damage INTEGER NOT NULL,
      skill_used TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS boss_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boss_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      reward_name TEXT NOT NULL,
      claimed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      claimed_at TEXT
    )
  `);

  saveDB();
}

async function getActiveBoss() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id, boss_name, max_hp, current_hp, status, reward_name, winner_player_id, created_at, ended_at
    FROM world_bosses
    WHERE status = 'active'
    ORDER BY id DESC
    LIMIT 1
  `);

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const row = result[0].values[0];

  return {
    boss_id: row[0],
    boss_name: row[1],
    max_hp: row[2],
    current_hp: row[3],
    status: row[4],
    reward_name: row[5],
    winner_player_id: row[6],
    created_at: row[7],
    ended_at: row[8]
  };
}

async function spawnBoss({ bossName = "Galaxy Devourer", maxHp = 5000, rewardName = "Galaxy Rune" }) {
  const db = await initDB();

  const active = await getActiveBoss();
  if (active) {
    throw new Error("there is already an active world boss");
  }

  db.run(
    `INSERT INTO world_bosses (
      boss_name,
      max_hp,
      current_hp,
      status,
      reward_name,
      created_at
    ) VALUES (?, ?, ?, 'active', ?, CURRENT_TIMESTAMP)`,
    [String(bossName), Number(maxHp), Number(maxHp), String(rewardName)]
  );

  saveDB();

  const created = await getActiveBoss();

  await createEvent({
    eventType: "world_boss_spawn",
    title: "World Boss Spawned",
    message: `🐉 ${created.boss_name} has appeared in the world`,
    metadata: {
      boss_id: created.boss_id,
      boss_name: created.boss_name,
      max_hp: created.max_hp
    }
  });

  return created;
}

async function joinBoss({ playerId }) {
  const db = await initDB();

  const boss = await getActiveBoss();
  if (!boss) {
    throw new Error("no active boss");
  }

  const player = db.exec(
    `SELECT id, nickname
     FROM players
     WHERE id = ?`,
    [Number(playerId)]
  );

  if (!player.length || !player[0].values.length) {
    throw new Error("player not found");
  }

  const nickname = player[0].values[0][1];

  const countResult = db.exec(
    `SELECT COUNT(*)
     FROM boss_participants
     WHERE boss_id = ?`,
    [Number(boss.boss_id)]
  );

  const currentParticipants = Number(countResult[0]?.values?.[0]?.[0] || 0);

  if (currentParticipants >= 20) {
    throw new Error("raid is full");
  }

  const existing = db.exec(
    `SELECT id
     FROM boss_participants
     WHERE boss_id = ?
       AND player_id = ?`,
    [Number(boss.boss_id), Number(playerId)]
  );

  if (existing.length && existing[0].values.length) {
    throw new Error("player already joined this raid");
  }

  db.run(
    `INSERT INTO boss_participants (
      boss_id,
      player_id,
      joined_at,
      total_damage,
      reward_claimed
    ) VALUES (?, ?, CURRENT_TIMESTAMP, 0, 0)`,
    [Number(boss.boss_id), Number(playerId)]
  );

  saveDB();

  await createEvent({
    eventType: "world_boss_join",
    title: "Raid Join",
    message: `⚔️ ${nickname} joined the ${boss.boss_name} raid`,
    metadata: {
      boss_id: boss.boss_id,
      player_id: Number(playerId)
    }
  });

  return {
    boss_id: boss.boss_id,
    player_id: Number(playerId),
    joined: true
  };
}

async function getCharacterDerived(playerId) {
  const db = await initDB();

  const stats = db.exec(
    `SELECT strength, dexterity, intelligence, vitality
     FROM character_progression
     WHERE player_id = ?`,
    [Number(playerId)]
  );

  if (!stats.length || !stats[0].values.length) {
    return {
      strength: 5,
      dexterity: 5,
      intelligence: 5,
      vitality: 5
    };
  }

  const row = stats[0].values[0];

  return {
    strength: Number(row[0]),
    dexterity: Number(row[1]),
    intelligence: Number(row[2]),
    vitality: Number(row[3])
  };
}

function calculateRaidDamage(playerClass, attrs) {
  if (playerClass === "Mago") {
    return 40 + attrs.intelligence * 4;
  }
  if (playerClass === "Cavaleiro") {
    return 45 + attrs.strength * 4;
  }
  if (playerClass === "Caçador") {
    return 38 + attrs.dexterity * 4;
  }
  return 30;
}

async function finalizeBossDefeat({ bossId, winnerPlayerId }) {
  const db = await initDB();

  const bossInfo = db.exec(
    `SELECT id, reward_name
     FROM world_bosses
     WHERE id = ?`,
    [Number(bossId)]
  );

  const rewardName = bossInfo[0]?.values?.[0]?.[1] || "Galaxy Rune";

  const participants = db.exec(
    `SELECT player_id
     FROM boss_participants
     WHERE boss_id = ?`,
    [Number(bossId)]
  );

  if (participants.length && participants[0].values.length) {
    for (const row of participants[0].values) {
      db.run(
        `INSERT INTO boss_rewards (
          boss_id,
          player_id,
          reward_name,
          claimed,
          created_at
        ) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)`,
        [Number(bossId), Number(row[0]), String(rewardName)]
      );
    }
  }

  db.run(
    `UPDATE world_bosses
     SET status = 'defeated',
         current_hp = 0,
         winner_player_id = ?,
         ended_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [Number(winnerPlayerId), Number(bossId)]
  );

  saveDB();

  const winner = db.exec(
    `SELECT nickname
     FROM players
     WHERE id = ?`,
    [Number(winnerPlayerId)]
  );

  const winnerNickname = winner[0]?.values?.[0]?.[0] || `Player ${winnerPlayerId}`;

  await createEvent({
    eventType: "world_boss_defeated",
    title: "World Boss Defeated",
    message: `🏆 ${winnerNickname} landed the final blow on the world boss`,
    metadata: {
      boss_id: Number(bossId),
      winner_player_id: Number(winnerPlayerId)
    }
  });
}

async function attackBoss({ playerId, skillUsed = null }) {
  const db = await initDB();

  const boss = await getActiveBoss();
  if (!boss) {
    throw new Error("no active boss");
  }

  const joined = db.exec(
    `SELECT id, total_damage
     FROM boss_participants
     WHERE boss_id = ?
       AND player_id = ?`,
    [Number(boss.boss_id), Number(playerId)]
  );

  if (!joined.length || !joined[0].values.length) {
    throw new Error("player has not joined the raid");
  }

  const player = db.exec(
    `SELECT id, nickname, class
     FROM players
     WHERE id = ?`,
    [Number(playerId)]
  );

  if (!player.length || !player[0].values.length) {
    throw new Error("player not found");
  }

  const nickname = player[0].values[0][1];
  const className = player[0].values[0][2];

  const attrs = await getCharacterDerived(playerId);
  let damage = calculateRaidDamage(className, attrs);

  if (skillUsed) {
    damage += 20;
  }

  const appliedDamage = Math.min(Number(boss.current_hp), Number(damage));
  const newHp = Number(boss.current_hp) - Number(appliedDamage);

  db.run(
    `INSERT INTO boss_damage_log (
      boss_id,
      player_id,
      damage,
      skill_used,
      created_at
    ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [Number(boss.boss_id), Number(playerId), Number(appliedDamage), skillUsed ? String(skillUsed) : null]
  );

  db.run(
    `UPDATE boss_participants
     SET total_damage = total_damage + ?
     WHERE boss_id = ?
       AND player_id = ?`,
    [Number(appliedDamage), Number(boss.boss_id), Number(playerId)]
  );

  db.run(
    `UPDATE world_bosses
     SET current_hp = ?
     WHERE id = ?`,
    [Number(newHp), Number(boss.boss_id)]
  );

  saveDB();

  if (newHp <= 0) {
    await finalizeBossDefeat({
      bossId: boss.boss_id,
      winnerPlayerId: Number(playerId)
    });

    return {
      boss_id: boss.boss_id,
      boss_name: boss.boss_name,
      player_id: Number(playerId),
      nickname,
      damage: Number(appliedDamage),
      current_hp: 0,
      defeated: true,
      winner_player_id: Number(playerId)
    };
  }

  return {
    boss_id: boss.boss_id,
    boss_name: boss.boss_name,
    player_id: Number(playerId),
    nickname,
    damage: Number(appliedDamage),
    current_hp: Number(newHp),
    defeated: false
  };
}

async function getBossStatus() {
  const db = await initDB();

  const active = await getActiveBoss();
  if (active) {
    const participantsCount = db.exec(
      `SELECT COUNT(*)
       FROM boss_participants
       WHERE boss_id = ?`,
      [Number(active.boss_id)]
    );

    return {
      ...active,
      participants: Number(participantsCount[0]?.values?.[0]?.[0] || 0)
    };
  }

  const last = db.exec(`
    SELECT id, boss_name, max_hp, current_hp, status, reward_name, winner_player_id, created_at, ended_at
    FROM world_bosses
    ORDER BY id DESC
    LIMIT 1
  `);

  if (!last.length || !last[0].values.length) {
    throw new Error("no boss found");
  }

  const row = last[0].values[0];

  return {
    boss_id: row[0],
    boss_name: row[1],
    max_hp: row[2],
    current_hp: row[3],
    status: row[4],
    reward_name: row[5],
    winner_player_id: row[6],
    created_at: row[7],
    ended_at: row[8],
    participants: 0
  };
}

async function getBossRanking() {
  const db = await initDB();

  const boss = await getBossStatus();
  const bossId = Number(boss.boss_id);

  const result = db.exec(
    `SELECT bp.player_id, p.nickname, p.class, bp.total_damage
     FROM boss_participants bp
     INNER JOIN players p ON p.id = bp.player_id
     WHERE bp.boss_id = ?
     ORDER BY bp.total_damage DESC, bp.player_id ASC`,
    [bossId]
  );

  if (!result.length) {
    return {
      boss_id: bossId,
      ranking: []
    };
  }

  return {
    boss_id: bossId,
    ranking: result[0].values.map((row, index) => ({
      rank: index + 1,
      player_id: row[0],
      nickname: row[1],
      class: row[2],
      total_damage: row[3]
    }))
  };
}

async function getPlayerRewards(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, boss_id, player_id, reward_name, claimed, created_at, claimed_at
     FROM boss_rewards
     WHERE player_id = ?
     ORDER BY id DESC`,
    [Number(playerId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    reward_id: row[0],
    boss_id: row[1],
    player_id: row[2],
    reward_name: row[3],
    claimed: Boolean(row[4]),
    created_at: row[5],
    claimed_at: row[6]
  }));
}

async function claimReward({ playerId, rewardId }) {
  const db = await initDB();

  const reward = db.exec(
    `SELECT id, boss_id, player_id, reward_name, claimed
     FROM boss_rewards
     WHERE id = ?`,
    [Number(rewardId)]
  );

  if (!reward.length || !reward[0].values.length) {
    throw new Error("reward not found");
  }

  const row = reward[0].values[0];

  if (Number(row[2]) !== Number(playerId)) {
    throw new Error("reward does not belong to player");
  }

  if (Number(row[4]) === 1) {
    throw new Error("reward already claimed");
  }

  db.run(
    `UPDATE boss_rewards
     SET claimed = 1,
         claimed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [Number(rewardId)]
  );

  saveDB();

  return {
    reward_id: Number(row[0]),
    boss_id: Number(row[1]),
    player_id: Number(row[2]),
    reward_name: row[3],
    claimed: true
  };
}

module.exports = {
  ensureRaidTables,
  spawnBoss,
  joinBoss,
  attackBoss,
  getBossStatus,
  getBossRanking,
  getPlayerRewards,
  claimReward
};
