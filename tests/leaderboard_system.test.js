const {
  updateLeaderboard,
  getTopPlayer
} = require("../src/domain/game/systems/leaderboard.system");

describe("Leaderboard System", () => {
  test("should return top players", () => {
    const players = [
      {name:"A", rankPoints:10},
      {name:"B", rankPoints:50},
      {name:"C", rankPoints:30}
    ];

    const leaderboard = updateLeaderboard(players);

    expect(leaderboard[0].name).toBe("B");
  });

  test("should return best player", () => {
    const players = [
      {name:"A", rankPoints:10},
      {name:"B", rankPoints:50}
    ];

    const best = getTopPlayer(players);

    expect(best.name).toBe("B");
  });
});
