const { addPlayer } = require("../src/domain/player/player.state");
const { enterWorld, getPlayersInWorld } = require("../src/domain/world/world.players");

describe("World Players", () => {

  test("player should enter world", () => {

    addPlayer({
      id:1,
      name:"Hero"
    });

    const result = enterWorld(1);

    expect(result.ok).toBe(true);

    const players = getPlayersInWorld();

    expect(players.length).toBe(1);

  });

});
