const { openLobby, joinLobby, startBossFight } = require("../src/domain/game/engine/boss/boss.lobby");

describe("Boss Lobby", () => {

  test("players should join boss lobby", () => {

    openLobby();

    const join = joinLobby(1);

    expect(join.ok).toBe(true);

  });

  test("boss fight should start with players", () => {

    openLobby();

    joinLobby(1);
    joinLobby(2);

    const fight = startBossFight();

    expect(fight.ok).toBe(true);
    expect(fight.players.length).toBe(2);

  });

});
