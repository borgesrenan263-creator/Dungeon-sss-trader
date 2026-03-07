const { initDB, saveDB } = require("../config/database");

async function ensureRankingTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS god_ranking_status (
      player_id INTEGER PRIMARY KEY,
      rank_position INTEGER NOT NULL,
      aura TEXT NOT NULL,
      bonus_gold_percent REAL DEFAULT 0,
      bonus_drop_percent REAL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS global_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      nickname TEXT NOT NULL,
      message TEXT NOT NULL,
      alert_type TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveDB();
}

function resolveAura(rank) {
  if (rank === 1) return "Aura Galáxia";
  if (rank === 2 || rank === 3) return "Fogo Azul";
  if (rank >= 4 && rank <= 10) return "Relâmpagos Brancos";
  return "Sem Aura";
}

function resolveBonuses(rank) {
  if (rank >= 1 && rank <= 10) {
    return {
      bonus_gold_percent: 10,
      bonus_drop_percent: 10
    };
  }

  return {
    bonus_gold_percent: 0,
    bonus_drop_percent: 0
  };
}

async function getTopPlayers() {
  const db = await initDB();

  const result = db.exec(`
    SELECT p.id,
           p.nickname,
           p.class,
           p.level,
           p.xp,
           c.gold
    FROM players p
    LEFT JOIN currencies c ON c.player_id = p.id
    ORDER BY p.level DESC, p.xp DESC, c.gold DESC
    LIMIT 10
  `);

  if (!result.length) return [];

  return result[0].values.map((row, index) => ({
    rank: index + 1,
    id: row[0],
    nickname: row[1],
    class: row[2],
    level: row[3],
    xp: row[4],
    gold: row[5] || 0,
    aura: resolveAura(index + 1)
  }));
}

async function getPlayerRank(playerId) {
  const db = await initDB();

  const result = db.exec(`
    SELECT p.id,
           p.nickname,
           p.level,
           p.xp,
           c.gold
    FROM players p
    LEFT JOIN currencies c ON c.player_id = p.id
    ORDER BY p.level DESC, p.xp DESC, c.gold DESC
  `);

  if (!result.length) return null;

  const players = result[0].values;

  for (let i = 0; i < players.length; i++) {
    if (players[i][0] === Number(playerId)) {
      return {
        rank: i + 1,
        id: players[i][0],
        nickname: players[i][1],
        level: players[i][2],
        xp: players[i][3],
        gold: players[i][4] || 0,
        aura: resolveAura(i + 1)
      };
    }
  }

  return null;
}

async function recalculateGodRanking() {
  const db = await initDB();

  const topPlayers = await getTopPlayers();

  db.run(`DELETE FROM god_ranking_status;`);

  for (const player of topPlayers) {
    const bonuses = resolveBonuses(player.rank);

    db.run(
      `INSERT INTO god_ranking_status (
        player_id,
        rank_position,
        aura,
        bonus_gold_percent,
        bonus_drop_percent,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
      [
        Number(player.id),
        Number(player.rank),
        player.aura,
        Number(bonuses.bonus_gold_percent),
        Number(bonuses.bonus_drop_percent)
      ]
    );
  }

  saveDB();

  return topPlayers;
}

async function getGodPlayers() {
  const db = await initDB();

  const result = db.exec(`
    SELECT g.player_id,
           g.rank_position,
           g.aura,
           g.bonus_gold_percent,
           g.bonus_drop_percent,
           p.nickname,
           p.class,
           p.level,
           p.xp
    FROM god_ranking_status g
    INNER JOIN players p ON p.id = g.player_id
    ORDER BY g.rank_position ASC;
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    player_id: row[0],
    rank: row[1],
    aura: row[2],
    bonus_gold_percent: row[3],
    bonus_drop_percent: row[4],
    nickname: row[5],
    class: row[6],
    level: row[7],
    xp: row[8]
  }));
}

async function announceGodLogin(playerId) {
  const db = await initDB();

  const godResult = db.exec(
    `SELECT g.player_id, g.rank_position, g.aura, p.nickname
     FROM god_ranking_status g
     INNER JOIN players p ON p.id = g.player_id
     WHERE g.player_id = ?;`,
    [Number(playerId)]
  );

  if (!godResult.length || !godResult[0].values.length) {
    return {
      is_god: false
    };
  }

  const row = godResult[0].values[0];
  const nickname = row[3];

  const message = `⚠️ [WARNING]: UM DEUS ENTRE NÓS! O SOBERANO ${nickname} ACABA DE MANIFESTAR-SE!`;

  db.run(
    `INSERT INTO global_alerts (player_id, nickname, message, alert_type)
     VALUES (?, ?, ?, 'god_login');`,
    [Number(row[0]), nickname, message]
  );

  saveDB();

  return {
    is_god: true,
    player_id: row[0],
    rank: row[1],
    aura: row[2],
    message
  };
}

async function getGlobalAlerts() {
  const db = await initDB();

  const result = db.exec(`
    SELECT id, player_id, nickname, message, alert_type, created_at
    FROM global_alerts
    ORDER BY id DESC
    LIMIT 20;
  `);

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    player_id: row[1],
    nickname: row[2],
    message: row[3],
    alert_type: row[4],
    created_at: row[5]
  }));
}

async function getGodBonusForPlayer(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT bonus_gold_percent, bonus_drop_percent, aura, rank_position
     FROM god_ranking_status
     WHERE player_id = ?;`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    return {
      rank: null,
      aura: "Sem Aura",
      bonus_gold_percent: 0,
      bonus_drop_percent: 0
    };
  }

  const row = result[0].values[0];

  return {
    rank: row[3],
    aura: row[2],
    bonus_gold_percent: row[0],
    bonus_drop_percent: row[1]
  };
}

module.exports = {
  ensureRankingTables,
  getTopPlayers,
  getPlayerRank,
  recalculateGodRanking,
  getGodPlayers,
  announceGodLogin,
  getGlobalAlerts,
  getGodBonusForPlayer
};
