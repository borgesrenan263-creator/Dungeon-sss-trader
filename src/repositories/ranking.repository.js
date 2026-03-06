const { initDB } = require("../config/database");

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
    gold: row[5] || 0
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
        gold: players[i][4]
      };

    }

  }

  return null;

}

module.exports = {
  getTopPlayers,
  getPlayerRank
};
