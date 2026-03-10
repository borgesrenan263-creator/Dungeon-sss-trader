const { autoUsePotion } = require("../src/engine/potion_engine");

describe("Potion Engine", () => {
  test("should auto heal when hp is low", () => {
    const player = {
      hp: 20,
      maxHp: 100
    };

    const result = autoUsePotion(player);

    expect(result.used).toBe(true);
    expect(player.hp).toBe(50);
  });
});
