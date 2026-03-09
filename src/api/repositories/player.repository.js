let players = [];
let nextId = 1;

async function createPlayer(nickname, playerClass) {
  const player = {
    id: nextId++,
    nickname,
    class: playerClass,
    level: 1,
    gold: 100,
    hp: playerClass === "Cavaleiro" ? 140 : playerClass === "Mago" ? 95 : 110
  };

  players.push(player);
  return player;
}

async function getPlayerById(id) {
  return players.find((p) => p.id === Number(id)) || null;
}

module.exports = {
  createPlayer,
  getPlayerById
};
