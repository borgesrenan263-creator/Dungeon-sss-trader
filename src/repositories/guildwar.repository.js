const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

async function ensureGuildWarTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS guild_wars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attacker_guild_id INTEGER NOT NULL,
      defender_guild_id INTEGER NOT NULL,
      sector_id INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      attacker_score INTEGER DEFAULT 0,
      defender_score INTEGER DEFAULT 0,
      winner_guild_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS guild_war_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      war_id INTEGER NOT NULL,
      log_type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function getGuildBasic(guildId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, guild_name, guild_tag
     FROM guilds
     WHERE id = ?;`,
    [Number(guildId)]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];

  return {
    guild_id: row[0],
    guild_name: row[1],
    guild_tag: row[2]
  };
}

async function getSectorBasic(sectorId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, sector_name
     FROM world_sectors
     WHERE id = ?;`,
    [Number(sectorId)]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];

  return {
    sector_id: row[0],
    sector_name: row[1]
  };
}

async function getActiveWarBySector(sectorId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, attacker_guild_id, defender_guild_id, sector_id, status,
            attacker_score, defender_score, winner_guild_id, created_at, ended_at
     FROM guild_wars
     WHERE sector_id = ?
       AND status = 'active'
     ORDER BY id DESC
     LIMIT 1;`,
    [Number(sectorId)]
  );

  if (!result.length || !result[0].values.length) return null;

  const row = result[0].values[0];

  return {
    war_id: row[0],
    attacker_guild_id: row[1],
    defender_guild_id: row[2],
    sector_id: row[3],
    status: row[4],
    attacker_score: row[5],
    defender_score: row[6],
    winner_guild_id: row[7],
    created_at: row[8],
    ended_at: row[9]
  };
}

async function declareGuildWar({ attackerGuildId, defenderGuildId, sectorId }) {
  const db = await initDB();

  if (Number(attackerGuildId) === Number(defenderGuildId)) {
    throw new Error("attacker and defender guild cannot be the same");
  }

  const attacker = await getGuildBasic(attackerGuildId);
  const defender = await getGuildBasic(defenderGuildId);
  const sector = await getSectorBasic(sectorId);

  if (!attacker) throw new Error("attacker guild not found");
  if (!defender) throw new Error("defender guild not found");
  if (!sector) throw new Error("sector not found");

  const existingWar = await getActiveWarBySector(sectorId);

  if (existingWar) {
    throw new Error("there is already an active war in this sector");
  }

  db.run(
    `INSERT INTO guild_wars (
      attacker_guild_id,
      defender_guild_id,
      sector_id,
      status,
      attacker_score,
      defender_score
    ) VALUES (?, ?, ?, 'active', 0, 0);`,
    [Number(attackerGuildId), Number(defenderGuildId), Number(sectorId)]
  );

  const warResult = db.exec(`
    SELECT id, attacker_guild_id, defender_guild_id, sector_id, status, created_at
    FROM guild_wars
    ORDER BY id DESC
    LIMIT 1;
  `);

  const warRow = warResult[0].values[0];
  const warId = Number(warRow[0]);

  const message =
    `⚔ ${attacker.guild_name} [${attacker.guild_tag}] declared war on ` +
    `${defender.guild_name} [${defender.guild_tag}] for ${sector.sector_name}`;

  db.run(
    `INSERT INTO guild_war_logs (
      war_id,
      log_type,
      message
    ) VALUES (?, 'war_declared', ?);`,
    [warId, message]
  );

  saveDB();

  await createEvent({
    eventType: "guild_war_declared",
    title: "Guild War Declared",
    message,
    metadata: {
      war_id: warId,
      attacker_guild_id: attacker.guild_id,
      attacker_guild_name: attacker.guild_name,
      attacker_guild_tag: attacker.guild_tag,
      defender_guild_id: defender.guild_id,
      defender_guild_name: defender.guild_name,
      defender_guild_tag: defender.guild_tag,
      sector_id: sector.sector_id,
      sector_name: sector.sector_name
    }
  });

  return {
    war_id: warId,
    attacker,
    defender,
    sector,
    status: "active",
    created_at: warRow[5]
  };
}

async function addGuildWarScore({ warId, guildId, points }) {
  const db = await initDB();

  const safePoints = Number(points);

  if (!safePoints || safePoints <= 0) {
    throw new Error("points must be greater than zero");
  }

  const warResult = db.exec(
    `SELECT id, attacker_guild_id, defender_guild_id, sector_id, status,
            attacker_score, defender_score
     FROM guild_wars
     WHERE id = ?;`,
    [Number(warId)]
  );

  if (!warResult.length || !warResult[0].values.length) {
    throw new Error("war not found");
  }

  const war = warResult[0].values[0];

  if (war[4] !== "active") {
    throw new Error("war is not active");
  }

  const guild = await getGuildBasic(guildId);

  if (!guild) {
    throw new Error("guild not found");
  }

  if (Number(guildId) !== Number(war[1]) && Number(guildId) !== Number(war[2])) {
    throw new Error("guild does not belong to this war");
  }

  if (Number(guildId) === Number(war[1])) {
    db.run(
      `UPDATE guild_wars
       SET attacker_score = attacker_score + ?
       WHERE id = ?;`,
      [safePoints, Number(warId)]
    );
  } else {
    db.run(
      `UPDATE guild_wars
       SET defender_score = defender_score + ?
       WHERE id = ?;`,
      [safePoints, Number(warId)]
    );
  }

  const sector = await getSectorBasic(war[3]);

  const message =
    `⚔ ${guild.guild_name} [${guild.guild_tag}] gained ${safePoints} war points in ${sector.sector_name}`;

  db.run(
    `INSERT INTO guild_war_logs (
      war_id,
      log_type,
      message
    ) VALUES (?, 'score_update', ?);`,
    [Number(warId), message]
  );

  saveDB();

  const updated = db.exec(
    `SELECT attacker_score, defender_score
     FROM guild_wars
     WHERE id = ?;`,
    [Number(warId)]
  );

  const scoreRow = updated[0].values[0];

  return {
    war_id: Number(warId),
    sector_id: war[3],
    sector_name: sector.sector_name,
    attacker_score: scoreRow[0],
    defender_score: scoreRow[1],
    updated_guild: guild
  };
}

async function finishGuildWar(warId) {
  const db = await initDB();

  const warResult = db.exec(
    `SELECT id, attacker_guild_id, defender_guild_id, sector_id, status,
            attacker_score, defender_score
     FROM guild_wars
     WHERE id = ?;`,
    [Number(warId)]
  );

  if (!warResult.length || !warResult[0].values.length) {
    throw new Error("war not found");
  }

  const war = warResult[0].values[0];

  if (war[4] !== "active") {
    throw new Error("war already finished");
  }

  const attacker = await getGuildBasic(war[1]);
  const defender = await getGuildBasic(war[2]);
  const sector = await getSectorBasic(war[3]);

  let winnerGuildId = null;
  let winnerGuild = null;
  let resultLabel = "draw";

  if (Number(war[5]) > Number(war[6])) {
    winnerGuildId = Number(war[1]);
    winnerGuild = attacker;
    resultLabel = "attacker_win";
  } else if (Number(war[6]) > Number(war[5])) {
    winnerGuildId = Number(war[2]);
    winnerGuild = defender;
    resultLabel = "defender_win";
  }

  db.run(
    `UPDATE guild_wars
     SET status = 'finished',
         winner_guild_id = ?,
         ended_at = CURRENT_TIMESTAMP
     WHERE id = ?;`,
    [winnerGuildId, Number(warId)]
  );

  let message;

  if (winnerGuild) {
    message =
      `🏆 ${winnerGuild.guild_name} [${winnerGuild.guild_tag}] won the war for ${sector.sector_name}`;

    db.run(
      `INSERT INTO guild_war_logs (
        war_id,
        log_type,
        message
      ) VALUES (?, 'war_finished', ?);`,
      [Number(warId), message]
    );

    saveDB();

    await createEvent({
      eventType: "guild_war_finished",
      title: "Guild War Finished",
      message,
      metadata: {
        war_id: Number(warId),
        winner_guild_id: winnerGuild.guild_id,
        winner_guild_name: winnerGuild.guild_name,
        winner_guild_tag: winnerGuild.guild_tag,
        sector_id: sector.sector_id,
        sector_name: sector.sector_name,
        attacker_score: Number(war[5]),
        defender_score: Number(war[6]),
        result: resultLabel
      }
    });
  } else {
    message = `⚖ Guild war for ${sector.sector_name} ended in a draw`;

    db.run(
      `INSERT INTO guild_war_logs (
        war_id,
        log_type,
        message
      ) VALUES (?, 'war_finished', ?);`,
      [Number(warId), message]
    );

    saveDB();

    await createEvent({
      eventType: "guild_war_finished",
      title: "Guild War Finished",
      message,
      metadata: {
        war_id: Number(warId),
        winner_guild_id: null,
        sector_id: sector.sector_id,
        sector_name: sector.sector_name,
        attacker_score: Number(war[5]),
        defender_score: Number(war[6]),
        result: resultLabel
      }
    });
  }

  return {
    war_id: Number(warId),
    sector,
    attacker,
    defender,
    attacker_score: Number(war[5]),
    defender_score: Number(war[6]),
    winner_guild: winnerGuild,
    result: resultLabel,
    message
  };
}

async function getGuildWarById(warId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, attacker_guild_id, defender_guild_id, sector_id, status,
            attacker_score, defender_score, winner_guild_id, created_at, ended_at
     FROM guild_wars
     WHERE id = ?;`,
    [Number(warId)]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const row = result[0].values[0];

  const attacker = await getGuildBasic(row[1]);
  const defender = await getGuildBasic(row[2]);
  const sector = await getSectorBasic(row[3]);
  const winner = row[7] ? await getGuildBasic(row[7]) : null;

  return {
    war_id: row[0],
    attacker,
    defender,
    sector,
    status: row[4],
    attacker_score: row[5],
    defender_score: row[6],
    winner_guild: winner,
    created_at: row[8],
    ended_at: row[9]
  };
}

async function getGuildWarLogs(warId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, war_id, log_type, message, created_at
     FROM guild_war_logs
     WHERE war_id = ?
     ORDER BY id DESC
     LIMIT 50;`,
    [Number(warId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    war_id: row[1],
    log_type: row[2],
    message: row[3],
    created_at: row[4]
  }));
}

module.exports = {
  ensureGuildWarTables,
  declareGuildWar,
  addGuildWarScore,
  finishGuildWar,
  getGuildWarById,
  getGuildWarLogs
};
