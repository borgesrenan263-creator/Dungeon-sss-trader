const { createWorldPlayer, moveToZone } = require("../src/engine/world_engine");
const { autoUsePotion } = require("../src/engine/potion_engine");

describe("World Farm Flow", () => {
  test("player should move zone and use potion", () => {
    const player = createWorldPlayer("Hero");

    moveToZone(player, 2);

    expect(player.zone).toBe(2);

    player.hp = 20;

    const potion = autoUsePotion(player);

    expect(potion.used).toBe(true);
    expect(player.hp).toBe(50);
  });
});
