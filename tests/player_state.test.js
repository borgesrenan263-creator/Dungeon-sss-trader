const { addPlayer, getPlayer } = require("../src/domain/player/player.state");

describe("Player State", () => {

  test("should add player", () => {

    addPlayer({
      id:1,
      name:"Hero"
    });

    const player = getPlayer(1);

    expect(player.name).toBe("Hero");

  });

});
