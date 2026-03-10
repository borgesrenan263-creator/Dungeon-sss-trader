const {
  getSectorTier,
  getSectorName,
  getSectorMobPool,
  createSectorPlayer,
  moveToSector,
  isBossSector,
  getSectorBoss
} = require("../src/engine/sector_engine");

describe("Sector Engine", () => {
  test("should resolve sector tier and name", () => {
    expect(getSectorTier(1)).toBe(1);
    expect(getSectorName(1)).toBe("Green Frontier");
    expect(getSectorMobPool(1).length).toBeGreaterThan(0);
  });

  test("player should move sector", () => {
    const player = createSectorPlayer("Hero");
    const result = moveToSector(player, 12);

    expect(result.ok).toBe(true);
    expect(player.sector).toBe(12);
    expect(result.tier).toBe(2);
  });

  test("should identify boss sector", () => {
    expect(isBossSector(10)).toBe(true);
    expect(getSectorBoss(10)).toBeTruthy();
    expect(isBossSector(11)).toBe(false);
  });
});
