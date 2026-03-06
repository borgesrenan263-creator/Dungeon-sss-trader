const { initDB, saveDB } = require("../config/database");

async function ensureBossTables() {

  const db = await initDB();

  db.run(`
    CREATE TABLE IF NOT EXISTS galaxy_boss (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      hp_layers INTEGER,
      is_alive INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS boss_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER,
      boss_id INTEGER
    )
  `);

  saveDB();
}

async function spawnBoss() {

  const db = await initDB();

  db.run(`
    INSERT INTO galaxy_boss (name, hp_layers, is_alive)
    VALUES ('Ceifador de Estrelas', 30, 1)
  `);

  saveDB();

  return {
    message: "Boss Galaxy spawned",
    hp_layers: 30
  };
}

async function joinBoss(playerId) {

  const db = await initDB();

  const boss = db.exec(`
    SELECT id FROM galaxy_boss
    WHERE is_alive = 1
    ORDER BY id DESC
    LIMIT 1
  `);

  if (!boss.length) {
    throw new Error("no active boss");
  }

  const bossId = boss[0].values[0][0];

  const count = db.exec(`
    SELECT COUNT(*) FROM boss_participants
    WHERE boss_id = ${bossId}
  `);

  if (count[0].values[0][0] >= 20) {
    throw new Error("raid full");
  }

  db.run(`
    INSERT INTO boss_participants (player_id, boss_id)
    VALUES (${playerId}, ${bossId})
  `);

  saveDB();

  return {
    message: "player joined raid",
    boss_id: bossId
  };
}

async function killBossLayer() {

  const db = await initDB();

  const boss = db.exec(`
    SELECT id, hp_layers
    FROM galaxy_boss
    WHERE is_alive = 1
    ORDER BY id DESC
    LIMIT 1
  `);

  if (!boss.length) {
    throw new Error("no active boss");
  }

  const bossId = boss[0].values[0][0];
  const hp = boss[0].values[0][1] - 1;

  if (hp <= 0) {

    db.run(`
      UPDATE galaxy_boss
      SET hp_layers = 0,
          is_alive = 0
      WHERE id = ${bossId}
    `);

    const players = db.exec(`
      SELECT player_id
      FROM boss_participants
      WHERE boss_id = ${bossId}
    `);

    const list = players[0]?.values || [];

    const winner =
      list[Math.floor(Math.random() * list.length)];

    return {
      boss_defeated: true,
      winner: winner ? winner[0] : null,
      reward: "Runa Galaxy"
    };

  }

  db.run(`
    UPDATE galaxy_boss
    SET hp_layers = ${hp}
    WHERE id = ${bossId}
  `);

  saveDB();

  return {
    boss_hp_layers: hp
  };

}

module.exports = {
  ensureBossTables,
  spawnBoss,
  joinBoss,
  killBossLayer
};
