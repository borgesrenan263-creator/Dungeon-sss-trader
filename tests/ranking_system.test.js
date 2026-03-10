const { updateRanking, getTopPlayers } = require("../src/domain/game/engine/ranking.engine");

describe("Ranking System", () => {

  test("should rank players by level", () => {

    updateRanking({ id:1, name:"A", level:5, xp:10 });
    updateRanking({ id:2, name:"B", level:10, xp:0 });

    const top = getTopPlayers();

    expect(top[0].name).toBe("B");

  });

});
