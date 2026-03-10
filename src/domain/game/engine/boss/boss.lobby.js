const lobby = {
  players: [],
  maxPlayers: 20,
  active: false
};

function openLobby() {
  lobby.players = [];
  lobby.active = true;

  return {
    ok: true,
    maxPlayers: lobby.maxPlayers
  };
}

function joinLobby(playerId) {

  if (!lobby.active) {
    return { ok:false, error:"lobby_closed" };
  }

  if (lobby.players.length >= lobby.maxPlayers) {
    return { ok:false, error:"lobby_full" };
  }

  if (!lobby.players.includes(playerId)) {
    lobby.players.push(playerId);
  }

  return {
    ok:true,
    players:lobby.players.length
  };
}

function startBossFight() {

  if (lobby.players.length === 0) {
    return { ok:false };
  }

  const players = [...lobby.players];

  lobby.active = false;
  lobby.players = [];

  return {
    ok:true,
    players
  };
}

module.exports = {
  openLobby,
  joinLobby,
  startBossFight
};
