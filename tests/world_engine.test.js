const {
  createWorldPlayer,
  moveToZone,
  getZone
} = require("../src/engine/world_engine");

describe("World Engine", () => {
  test("player should move to another zone", () => {
    const player = createWorldPlayer("Hero");

    const result = moveToZone(player, 2);

    expect(result.ok).toBe(true);
    expect(player.zone).toBe(2);
    expect(getZone(2).name).toBe("Wolf Forest");
  });
});
