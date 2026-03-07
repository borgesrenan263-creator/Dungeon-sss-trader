const { initDB, saveDB } = require("../config/database");
const { createEvent } = require("./events.repository");

async function ensureGuildTables() {
  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS guilds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_name TEXT UNIQUE NOT NULL,
      guild_tag TEXT UNIQUE NOT NULL,
      leader_player_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS guild_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS guild_treasury (
      guild_id INTEGER PRIMARY KEY,
      gold INTEGER DEFAULT 0,
      obsidian REAL DEFAULT 0,
      usdt REAL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS guild_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id INTEGER NOT NULL,
      log_type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
}

async function getPlayerById(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, nickname, class, level
     FROM players
     WHERE id = ?;`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const row = result[0].values[0];

  return {
    id: row[0],
    nickname: row[1],
    class: row[2],
    level: row[3]
  };
}

async function getPlayerGuildMembership(playerId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT gm.guild_id, gm.role, g.guild_name, g.guild_tag
     FROM guild_members gm
     INNER JOIN guilds g ON g.id = gm.guild_id
     WHERE gm.player_id = ?;`,
    [Number(playerId)]
  );

  if (!result.length || !result[0].values.length) {
    return null;
  }

  const row = result[0].values[0];

  return {
    guild_id: row[0],
    role: row[1],
    guild_name: row[2],
    guild_tag: row[3]
  };
}

async function createGuild({ leaderPlayerId, guildName, guildTag }) {
  const db = await initDB();

  const player = await getPlayerById(leaderPlayerId);

  if (!player) {
    throw new Error("leader player not found");
  }

  const membership = await getPlayerGuildMembership(leaderPlayerId);

  if (membership) {
    throw new Error("player already belongs to a guild");
  }

  const safeGuildName = String(guildName || "").trim();
  const safeGuildTag = String(guildTag || "").trim().toUpperCase();

  if (!safeGuildName || safeGuildName.length < 3) {
    throw new Error("guild name must have at least 3 characters");
  }

  if (!safeGuildTag || safeGuildTag.length < 2 || safeGuildTag.length > 6) {
    throw new Error("guild tag must have 2 to 6 characters");
  }

  const existingName = db.exec(
    `SELECT id FROM guilds WHERE guild_name = ?;`,
    [safeGuildName]
  );

  if (existingName.length && existingName[0].values.length) {
    throw new Error("guild name already exists");
  }

  const existingTag = db.exec(
    `SELECT id FROM guilds WHERE guild_tag = ?;`,
    [safeGuildTag]
  );

  if (existingTag.length && existingTag[0].values.length) {
    throw new Error("guild tag already exists");
  }

  db.run(
    `INSERT INTO guilds (
      guild_name,
      guild_tag,
      leader_player_id
    ) VALUES (?, ?, ?);`,
    [safeGuildName, safeGuildTag, Number(leaderPlayerId)]
  );

  const guildResult = db.exec(`
    SELECT id, guild_name, guild_tag, leader_player_id, created_at
    FROM guilds
    ORDER BY id DESC
    LIMIT 1;
  `);

  const guildRow = guildResult[0].values[0];
  const guildId = Number(guildRow[0]);

  db.run(
    `INSERT INTO guild_members (
      guild_id,
      player_id,
      role
    ) VALUES (?, ?, 'Leader');`,
    [guildId, Number(leaderPlayerId)]
  );

  db.run(
    `INSERT INTO guild_treasury (
      guild_id,
      gold,
      obsidian,
      usdt
    ) VALUES (?, 0, 0, 0);`,
    [guildId]
  );

  const logMessage = `${player.nickname} created guild ${safeGuildName} [${safeGuildTag}]`;

  db.run(
    `INSERT INTO guild_logs (
      guild_id,
      log_type,
      message
    ) VALUES (?, 'guild_created', ?);`,
    [guildId, logMessage]
  );

  saveDB();

  await createEvent({
    eventType: "guild_created",
    title: "New Guild Created",
    message: `🛡 ${player.nickname} created guild ${safeGuildName} [${safeGuildTag}]`,
    metadata: {
      guild_id: guildId,
      guild_name: safeGuildName,
      guild_tag: safeGuildTag,
      leader_player_id: Number(leaderPlayerId),
      leader_nickname: player.nickname
    }
  });

  return {
    guild_id: guildId,
    guild_name: guildRow[1],
    guild_tag: guildRow[2],
    leader_player_id: guildRow[3],
    created_at: guildRow[4]
  };
}

async function joinGuild({ playerId, guildId }) {
  const db = await initDB();

  const player = await getPlayerById(playerId);

  if (!player) {
    throw new Error("player not found");
  }

  const membership = await getPlayerGuildMembership(playerId);

  if (membership) {
    throw new Error("player already belongs to a guild");
  }

  const guildResult = db.exec(
    `SELECT id, guild_name, guild_tag
     FROM guilds
     WHERE id = ?;`,
    [Number(guildId)]
  );

  if (!guildResult.length || !guildResult[0].values.length) {
    throw new Error("guild not found");
  }

  const guildRow = guildResult[0].values[0];

  db.run(
    `INSERT INTO guild_members (
      guild_id,
      player_id,
      role
    ) VALUES (?, ?, 'Member');`,
    [Number(guildId), Number(playerId)]
  );

  const logMessage = `${player.nickname} joined guild ${guildRow[1]} [${guildRow[2]}]`;

  db.run(
    `INSERT INTO guild_logs (
      guild_id,
      log_type,
      message
    ) VALUES (?, 'member_joined', ?);`,
    [Number(guildId), logMessage]
  );

  saveDB();

  await createEvent({
    eventType: "guild_join",
    title: "Guild Member Joined",
    message: `👥 ${player.nickname} joined ${guildRow[1]} [${guildRow[2]}]`,
    metadata: {
      guild_id: Number(guildId),
      guild_name: guildRow[1],
      guild_tag: guildRow[2],
      player_id: Number(playerId),
      player_nickname: player.nickname
    }
  });

  return {
    guild_id: Number(guildId),
    guild_name: guildRow[1],
    guild_tag: guildRow[2],
    player_id: Number(playerId),
    player_nickname: player.nickname,
    role: "Member"
  };
}

async function getGuildById(guildId) {
  const db = await initDB();

  const guildResult = db.exec(
    `SELECT id, guild_name, guild_tag, leader_player_id, created_at
     FROM guilds
     WHERE id = ?;`,
    [Number(guildId)]
  );

  if (!guildResult.length || !guildResult[0].values.length) {
    return null;
  }

  const guildRow = guildResult[0].values[0];

  const membersResult = db.exec(
    `SELECT gm.id, gm.player_id, p.nickname, p.class, p.level, gm.role, gm.joined_at
     FROM guild_members gm
     INNER JOIN players p ON p.id = gm.player_id
     WHERE gm.guild_id = ?
     ORDER BY gm.id ASC;`,
    [Number(guildId)]
  );

  const members = membersResult.length
    ? membersResult[0].values.map((row) => ({
        member_id: row[0],
        player_id: row[1],
        nickname: row[2],
        class: row[3],
        level: row[4],
        role: row[5],
        joined_at: row[6]
      }))
    : [];

  return {
    guild_id: guildRow[0],
    guild_name: guildRow[1],
    guild_tag: guildRow[2],
    leader_player_id: guildRow[3],
    created_at: guildRow[4],
    total_members: members.length,
    members
  };
}

async function getGuildTreasury(guildId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT guild_id, gold, obsidian, usdt, updated_at
     FROM guild_treasury
     WHERE guild_id = ?;`,
    [Number(guildId)]
  );

  if (!result.length || !result[0].values.length) {
    throw new Error("guild treasury not found");
  }

  const row = result[0].values[0];

  return {
    guild_id: row[0],
    gold: row[1],
    obsidian: row[2],
    usdt: row[3],
    updated_at: row[4]
  };
}

async function depositGuildTreasury({ guildId, gold = 0, obsidian = 0, usdt = 0 }) {
  const db = await initDB();

  const guildResult = db.exec(
    `SELECT id, guild_name, guild_tag
     FROM guilds
     WHERE id = ?;`,
    [Number(guildId)]
  );

  if (!guildResult.length || !guildResult[0].values.length) {
    throw new Error("guild not found");
  }

  const safeGold = Number(gold) || 0;
  const safeObsidian = Number(obsidian) || 0;
  const safeUsdt = Number(usdt) || 0;

  db.run(
    `UPDATE guild_treasury
     SET gold = gold + ?,
         obsidian = obsidian + ?,
         usdt = usdt + ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE guild_id = ?;`,
    [safeGold, safeObsidian, safeUsdt, Number(guildId)]
  );

  const logMessage =
    `Treasury updated: +${safeGold} gold / +${safeObsidian} obsidian / +${safeUsdt} usdt`;

  db.run(
    `INSERT INTO guild_logs (
      guild_id,
      log_type,
      message
    ) VALUES (?, 'treasury_update', ?);`,
    [Number(guildId), logMessage]
  );

  saveDB();

  return getGuildTreasury(guildId);
}

async function getGuildLogs(guildId) {
  const db = await initDB();

  const result = db.exec(
    `SELECT id, guild_id, log_type, message, created_at
     FROM guild_logs
     WHERE guild_id = ?
     ORDER BY id DESC
     LIMIT 30;`,
    [Number(guildId)]
  );

  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0],
    guild_id: row[1],
    log_type: row[2],
    message: row[3],
    created_at: row[4]
  }));
}

module.exports = {
  ensureGuildTables,
  createGuild,
  joinGuild,
  getGuildById,
  getGuildTreasury,
  depositGuildTreasury,
  getGuildLogs
};
