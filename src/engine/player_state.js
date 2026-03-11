const {
  ensurePlayer,
  getPlayerByName,
  getLastCreatedPlayer,
  getAllPlayers,
  resetPlayers
} = require("./game_state");

function addPlayer(name, nickname) {
  return ensurePlayer(name, nickname);
}

module.exports = {
  addPlayer,
  ensurePlayer,
  getPlayerByName,
  getLastCreatedPlayer,
  getAllPlayers,
  resetPlayers
};
