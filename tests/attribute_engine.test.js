const {
  createBaseAttributes,
  calculateDerivedStats
} = require("../src/engine/attribute_engine");

describe("Attribute Engine", () => {
  test("should create base attributes", () => {
    const attrs = createBaseAttributes();

    expect(attrs.str).toBe(10);
    expect(attrs.dex).toBe(5);
    expect(attrs.int).toBe(5);
    expect(attrs.vit).toBe(10);
  });

  test("should calculate derived stats", () => {
    const stats = calculateDerivedStats({
      str: 10,
      dex: 5,
      int: 5,
      vit: 10
    });

    expect(stats.atk).toBe(25);
    expect(stats.skillPower).toBe(10);
    expect(stats.hp).toBe(100);
  });
});
