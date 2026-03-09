const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");
const { getPlayerCombatProfile } = require("./combat_core.repository");

async function ensureArenaTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS arena_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER UNIQUE NOT NULL,
      status TEXT DEFAULT 'queued',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS arena_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1_id INTEGER NOT NULL,
      player2_id INTEGER NOT NULL,
      player1_hp INTEGER NOT NULL,
      player2_hp INTEGER NOT NULL,
      turn_player_id INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      winner_player_id INTEGER,
      loser_player_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS arena_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      attacker_player_id INTEGER NOT NULL,
      defender_player_id INTEGER NOT NULL,
      damage INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS arena_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER UNIQUE NOT NULL,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      total_damage_dealt INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function ensureArenaStats(playerId) {
  const db = await initDB();

  const existing = db.exec(
    `SELECT id FROM arena_stats WHERE player_id = ?`,
    [Number(playerId)]
  );

  if (!existing.length || !existing[0].values.length) {
    db.run(
      `INSERT INTO arena_stats (
        player_id,
        wins,
        losses,
        total_damage_dealt,
        updated_at
      ) VALUES (?, 0, 0, 0, CURRENT_TIMESTAMP)`,
      [Number(playerId)]
    );
    saveDB();
  }
}

async function getPlayerBasic(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, nickname, class, level
     FROM players
     WHERE id = ?`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];

  return {
    player_id: row[0],
    nickname: row[1],
    class: row[2],
    level: row[3]
  };
}

async function getActiveArenaMatchByPlayer(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, player1_id, player2_id, player1_hp, player2_hp, turn_player_id,
            status, winner_player_id, loser_player_id, created_at, ended_at
     FROM arena_matches
     WHERE status = 'active'
       AND (player1_id = ? OR player2_id = ?)
     ORDER BY id DESC
     LIMIT 1`,
    [Number(playerId), Number(playerId)]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];

  return {
    match_id: row[0],
    player1_id: row[1],
    player2_id: row[2],
    player1_hp: row[3],
    player2_hp: row[4],
    turn_player_id: row[5],
    status: row[6],
    winner_player_id: row[7],
    loser_player_id: row[8],
    created_at: row[9],
    ended_at: row[10]
  };
}

async function joinArenaQueue({ playerId }) {
  const db = await initDB();

  const player = await getPlayerBasic(playerId);
  if (!player) {
    throw new Error("player not found");
  }

  const activeMatch = await getActiveArenaMatchByPlayer(playerId);
  if (activeMatch) {
    throw new Error("player already has an active arena match");
  }

  const existing = db.exec(
    `SELECT id
     FROM arena_queue
     WHERE player_id = ?
       AND status = 'queued'`,
    [Number(playerId)]
  );

  if (existing.length && existing[0].values.length) {
    throw new Error("player already in arena queue");
  }

  db.run(
    `INSERT INTO arena_queue (
      player_id,
      status,
      created_at
    ) VALUES (?, 'queued', CURRENT_TIMESTAMP)`,
    [Number(playerId)]
  );

  saveDB();

  return {
    player_id: Number(playerId),
    status: "queued"
  };
}

async function startArenaMatch() {
  const db = await initDB();

  const queued = db.exec(`
    SELECT id, player_id
    FROM arena_queue
    WHERE status = 'queued'
    ORDER BY id ASC
    LIMIT 2
  `);

  if (!queued.length || queued[0].values.length < 2) {
    throw new Error("not enough players in queue");
  }

  const first = queued[0].values[0];
  const second = queued[0].values[1];

  const p1Profile = await getPlayerCombatProfile(first[1]);
  const p2Profile = await getPlayerCombatProfile(second[1]);

  const p1Hp = Number(p1Profile.final_stats.max_hp || 100);
  const p2Hp = Number(p2Profile.final_stats.max_hp || 100);

  db.run(
    `INSERT INTO arena_matches (
      player1_id,
      player2_id,
      player1_hp,
      player2_hp,
      turn_player_id,
      status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`,
    [Number(first[1]), Number(second[1]), p1Hp, p2Hp, Number(first[1])]
  );

  db.run(
    `DELETE FROM arena_queue
     WHERE player_id IN (?, ?)`,
    [Number(first[1]), Number(second[1])]
  );

  await ensureArenaStats(first[1]);
  await ensureArenaStats(second[1]);

  saveDB();

  const created = db.exec(`
    SELECT id, player1_id, player2_id, player1_hp, player2_hp, turn_player_id, status, created_at
    FROM arena_matches
    ORDER BY id DESC
    LIMIT 1
  `);

  const row = created[0].values[0];

  const p1 = await getPlayerBasic(row[1]);
  const p2 = await getPlayerBasic(row[2]);

  await createEvent({
    eventType: "arena_match_started",
    title: "Arena Match Started",
    message: `⚔️ Arena match started: ${p1?.nickname || row[1]} vs ${p2?.nickname || row[2]}`,
    metadata: {
      match_id: Number(row[0]),
      player1_id: Number(row[1]),
      player2_id: Number(row[2])
    }
  });

  return {
    match_id: row[0],
    player1_id: row[1],
    player2_id: row[2],
    player1_hp: row[3],
    player2_hp: row[4],
    turn_player_id: row[5],
    status: row[6],
    created_at: row[7]
  };
}

async function attackArena({ attackerPlayerId }) {
  const db = await initDB();

  const match = await getActiveArenaMatchByPlayer(attackerPlayerId);
  if (!match) {
    throw new Error("active arena match not found");
  }

  if (Number(match.turn_player_id) !== Number(attackerPlayerId)) {
    throw new Error("it is not this player's turn");
  }

  const attackerProfile = await getPlayerCombatProfile(attackerPlayerId);

  const defenderPlayerId =
    Number(match.player1_id) === Number(attackerPlayerId)
      ? Number(match.player2_id)
      : Number(match.player1_id);

  const defenderProfile = await getPlayerCombatProfile(defenderPlayerId);

  const attackerPower =
    Number(attackerProfile.final_stats.attack_power || 0) +
    Math.floor(Number(attackerProfile.final_stats.magic_power || 0) / 2);

  const defenderDefense = Number(defenderProfile.final_stats.defense || 0);

  const baseDamage = Math.max(10, attackerPower - Math.floor(defenderDefense / 3));

  const isAgainstPlayer1 = Number(defenderPlayerId) === Number(match.player1_id);
  let newPlayer1Hp = Number(match.player1_hp);
  let newPlayer2Hp = Number(match.player2_hp);

  if (isAgainstPlayer1) {
    newPlayer1Hp = Math.max(0, newPlayer1Hp - baseDamage);
  } else {
    newPlayer2Hp = Math.max(0, newPlayer2Hp - baseDamage);
  }

  db.run(
    `INSERT INTO arena_logs (
      match_id,
      attacker_player_id,
      defender_player_id,
      damage,
      created_at
    ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      Number(match.match_id),
      Number(attackerPlayerId),
      Number(defenderPlayerId),
      Number(baseDamage)
    ]
  );

  db.run(
    `UPDATE arena_stats
     SET total_damage_dealt = total_damage_dealt + ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE player_id = ?`,
    [Number(baseDamage), Number(attackerPlayerId)]
  );

  const defenderDied = newPlayer1Hp <= 0 || newPlayer2Hp <= 0;

  if (defenderDied) {
    db.run(
      `UPDATE arena_matches
       SET player1_hp = ?,
           player2_hp = ?,
           status = 'finished',
           winner_player_id = ?,
           loser_player_id = ?,
           ended_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        Number(newPlayer1Hp),
        Number(newPlayer2Hp),
        Number(attackerPlayerId),
        Number(defenderPlayerId),
        Number(match.match_id)
      ]
    );

    db.run(
      `UPDATE arena_stats
       SET wins = wins + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE player_id = ?`,
      [Number(attackerPlayerId)]
    );

    db.run(
      `UPDATE arena_stats
       SET losses = losses + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE player_id = ?`,
      [Number(defenderPlayerId)]
    );

    saveDB();

    const attacker = await getPlayerBasic(attackerPlayerId);
    const defender = await getPlayerBasic(defenderPlayerId);

    await createEvent({
      eventType: "arena_match_finished",
      title: "Arena Match Finished",
      message: `🏆 ${attacker?.nickname || attackerPlayerId} defeated ${defender?.nickname || defenderPlayerId} in the arena`,
      metadata: {
        match_id: Number(match.match_id),
        winner_player_id: Number(attackerPlayerId),
        loser_player_id: Number(defenderPlayerId)
      }
    });

    return {
      match_id: Number(match.match_id),
      attacker_player_id: Number(attackerPlayerId),
      defender_player_id: Number(defenderPlayerId),
      damage: Number(baseDamage),
      player1_hp: Number(newPlayer1Hp),
      player2_hp: Number(newPlayer2Hp),
      finished: true,
      winner_player_id: Number(attackerPlayerId)
    };
  }

  db.run(
    `UPDATE arena_matches
     SET player1_hp = ?,
         player2_hp = ?,
         turn_player_id = ?
     WHERE id = ?`,
    [
      Number(newPlayer1Hp),
      Number(newPlayer2Hp),
      Number(defenderPlayerId),
      Number(match.match_id)
    ]
  );

  saveDB();

  return {
    match_id: Number(match.match_id),
    attacker_player_id: Number(attackerPlayerId),
    defender_player_id: Number(defenderPlayerId),
    damage: Number(baseDamage),
    player1_hp: Number(newPlayer1Hp),
    player2_hp: Number(newPlayer2Hp),
    finished: false,
    next_turn_player_id: Number(defenderPlayerId)
  };
}

async function getArenaStatus(playerId) {
  const db = await initDB();

  const active = await getActiveArenaMatchByPlayer(playerId);
  if (active) {
    return active;
  }

  const latest = db.exec(
    `SELECT id, player1_id, player2_id, player1_hp, player2_hp, turn_player_id,
            status, winner_player_id, loser_player_id, created_at, ended_at
     FROM arena_matches
     WHERE player1_id = ? OR player2_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [Number(playerId), Number(playerId)]
  );

  if (!latest.length || !latest[0].values.length) {
    throw new Error("arena match not found for player");
  }

  const row = latest[0].values[0];

  return {
    match_id: row[0],
    player1_id: row[1],
    player2_id: row[2],
    player1_hp: row[3],
    player2_hp: row[4],
    turn_player_id: row[5],
    status: row[6],
    winner_player_id: row[7],
    loser_player_id: row[8],
    created_at: row[9],
    ended_at: row[10]
  };
}

async function getArenaHistory(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, player1_id, player2_id, winner_player_id, loser_player_id, status, created_at, ended_at
     FROM arena_matches
     WHERE player1_id = ? OR player2_id = ?
     ORDER BY id DESC`,
    [Number(playerId), Number(playerId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    match_id: row[0],
    player1_id: row[1],
    player2_id: row[2],
    winner_player_id: row[3],
    loser_player_id: row[4],
    status: row[5],
    created_at: row[6],
    ended_at: row[7]
  }));
}

async function getArenaRanking() {
  const db = await initDB();

  const result = db.exec(
    `SELECT ast.player_id, p.nickname, p.class, p.level, ast.wins, ast.losses, ast.total_damage_dealt
     FROM arena_stats ast
     INNER JOIN players p ON p.id = ast.player_id
     ORDER BY ast.wins DESC, ast.total_damage_dealt DESC, p.level DESC`
  );

  if (!result.length) return [];

  return result[0].values.map((row, index) => ({
    rank: index + 1,
    player_id: row[0],
    nickname: row[1],
    class: row[2],
    level: row[3],
    wins: row[4],
    losses: row[5],
    total_damage_dealt: row[6]
  }));
}

module.exports = {
  ensureArenaTables,
  joinArenaQueue,
  startArenaMatch,
  attackArena,
  getArenaStatus,
  getArenaHistory,
  getArenaRanking
};
