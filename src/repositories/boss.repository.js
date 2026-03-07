const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

async function ensureBossTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS galaxy_boss (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      hp_layers INTEGER NOT NULL,
      is_alive INTEGER DEFAULT 1,
      max_participants INTEGER DEFAULT 20,
      reward_name TEXT DEFAULT 'Runa Galaxy',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS boss_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      boss_id INTEGER NOT NULL,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS boss_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boss_id INTEGER NOT NULL,
      winner_player_id INTEGER NOT NULL,
      reward_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ascension_bonuses (
      player_id INTEGER PRIMARY KEY,
      boss_kills INTEGER DEFAULT 0,
      permanent_bonus_percent REAL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function ensureAscensionRow(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT player_id
     FROM ascension_bonuses
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    db.run(
      `INSERT INTO ascension_bonuses (
        player_id,
        boss_kills,
        permanent_bonus_percent
      ) VALUES (?, 0, 0);`,
      [Number(playerId)]
    );
    saveDB();
  }
}

async function spawnBoss() {
  const db = await initDB();

  const active = db.exec(`
    SELECT id
    FROM galaxy_boss
    WHERE is_alive = 1
    ORDER BY id DESC
    LIMIT 1;
  `);

  if (active.length && active[0].values.length) {
    throw new Error("there is already an active galaxy boss");
  }

  db.run(`
    INSERT INTO galaxy_boss (
      name,
      hp_layers,
      is_alive,
      max_participants,
      reward_name
    ) VALUES (
      'Ceifador de Estrelas',
      30,
      1,
      20,
      'Runa Galaxy'
    );
  `);

  saveDB();

  const event = await createEvent({
    eventType: "boss_spawn",
    title: "Galaxy Boss Spawned",
    message: "⚠ Galaxy Boss has appeared in Galaxy Rift",
    metadata: {
      boss_name: "Ceifador de Estrelas",
      hp_layers: 30,
      reward_name: "Runa Galaxy"
    }
  });

  return {
    message: "Boss Galaxy spawned",
    hp_layers: 30,
    reward: "Runa Galaxy",
    event_id: event.id
  };
}

async function getActiveBoss() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id, name, hp_layers, is_alive, max_participants, reward_name, created_at
    FROM galaxy_boss
    WHERE is_alive = 1
    ORDER BY id DESC
    LIMIT 1;
  `);

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];

  return {
    id: row[0],
    name: row[1],
    hp_layers: row[2],
    is_alive: Boolean(row[3]),
    max_participants: row[4],
    reward_name: row[5],
    created_at: row[6]
  };
}

async function joinBoss(playerId) {
  const db = await initDB();

  const boss = await getActiveBoss();

  if (!boss) {
    throw new Error("no active boss");
  }

  const playerResult = db.exec(
    `SELECT id, nickname, level
     FROM players
     WHERE id = ?;`,
    [Number(playerId)]
  );

  if (!playerResult.length || !playerResult[0].values.length) {
    throw new Error("player not found");
  }

  const alreadyJoined = db.exec(
    `SELECT id
     FROM boss_participants
     WHERE boss_id = ?
       AND player_id = ?;`,
    [Number(boss.id), Number(playerId)]
  );

  if (alreadyJoined.length && alreadyJoined[0].values.length) {
    throw new Error("player already joined this raid");
  }

  const count = db.exec(
    `SELECT COUNT(*)
     FROM boss_participants
     WHERE boss_id = ?;`,
    [Number(boss.id)]
  );

  const total = Number(count[0]?.values?.[0]?.[0] || 0);

  if (total >= Number(boss.max_participants)) {
    throw new Error("raid full");
  }

  db.run(
    `INSERT INTO boss_participants (player_id, boss_id)
     VALUES (?, ?);`,
    [Number(playerId), Number(boss.id)]
  );

  saveDB();

  return {
    message: "player joined raid",
    boss_id: boss.id,
    player_id: Number(playerId),
    participants_after_join: total + 1
  };
}

async function getBossParticipants() {
  const db = await initDB();

  const boss = await getActiveBoss();

  if (!boss) return [];

  const result = db.exec(
    `SELECT bp.id, bp.player_id, p.nickname, p.class, p.level, bp.joined_at
     FROM boss_participants bp
     INNER JOIN players p ON p.id = bp.player_id
     WHERE bp.boss_id = ?
     ORDER BY bp.id ASC;`,
    [Number(boss.id)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    player_id: row[1],
    nickname: row[2],
    class: row[3],
    level: row[4],
    joined_at: row[5]
  }));
}

async function damageBossLayer() {
  const db = await initDB();

  const boss = await getActiveBoss();

  if (!boss) {
    throw new Error("no active boss");
  }

  const participants = await getBossParticipants();

  if (participants.length === 0) {
    throw new Error("no participants in raid");
  }

  const newHp = Number(boss.hp_layers) - 1;

  if (newHp > 0) {
    db.run(
      `UPDATE galaxy_boss
       SET hp_layers = ?
       WHERE id = ?;`,
      [newHp, Number(boss.id)]
    );

    saveDB();

    return {
      boss_defeated: false,
      boss_id: boss.id,
      hp_layers: newHp
    };
  }

  db.run(
    `UPDATE galaxy_boss
     SET hp_layers = 0,
         is_alive = 0,
         ended_at = CURRENT_TIMESTAMP
     WHERE id = ?;`,
    [Number(boss.id)]
  );

  const winner =
    participants[Math.floor(Math.random() * participants.length)];

  db.run(
    `INSERT INTO boss_rewards (
      boss_id,
      winner_player_id,
      reward_name
     ) VALUES (?, ?, 'Runa Galaxy');`,
    [Number(boss.id), Number(winner.player_id)]
  );

  await ensureAscensionRow(winner.player_id);

  db.run(
    `UPDATE ascension_bonuses
     SET boss_kills = boss_kills + 1,
         permanent_bonus_percent = permanent_bonus_percent + 0.1,
         updated_at = CURRENT_TIMESTAMP
     WHERE player_id = ?;`,
    [Number(winner.player_id)]
  );

  saveDB();

  await createEvent({
    eventType: "boss_defeat",
    title: "Galaxy Boss Defeated",
    message: `🏆 ${winner.nickname} won the Runa Galaxy lottery`,
    metadata: {
      boss_id: boss.id,
      winner_player_id: winner.player_id,
      winner_nickname: winner.nickname,
      reward_name: "Runa Galaxy",
      ascension_bonus_percent_gained: 0.1
    }
  });

  return {
    boss_defeated: true,
    boss_id: boss.id,
    winner_player_id: winner.player_id,
    winner_nickname: winner.nickname,
    reward: "Runa Galaxy",
    ascension_bonus_percent_gained: 0.1
  };
}

async function getBossRewards() {
  const db = await initDB();

  const result = db.exec(`
    SELECT br.id,
           br.boss_id,
           br.winner_player_id,
           p.nickname,
           br.reward_name,
           br.created_at
    FROM boss_rewards br
    INNER JOIN players p ON p.id = br.winner_player_id
    ORDER BY br.id DESC;
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    boss_id: row[1],
    winner_player_id: row[2],
    winner_nickname: row[3],
    reward_name: row[4],
    created_at: row[5]
  }));
}

async function getAscensionStatus(playerId) {
  const db = await initDB();

  await ensureAscensionRow(playerId);

  const result = db.exec(
    `SELECT player_id, boss_kills, permanent_bonus_percent, updated_at
     FROM ascension_bonuses
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  const row = result[0].values[0];

  return {
    player_id: row[0],
    boss_kills: row[1],
    permanent_bonus_percent: row[2],
    updated_at: row[3]
  };
}

module.exports = {
  ensureBossTables,
  spawnBoss,
  getActiveBoss,
  joinBoss,
  getBossParticipants,
  damageBossLayer,
  getBossRewards,
  getAscensionStatus
};
