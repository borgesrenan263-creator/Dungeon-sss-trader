const {
  getWorld,
  getSectors,
  getSectorById,
  spawnInSector,
  advanceWorldTick
} = require("../src/engine/world_map_engine");

describe("World Map Engine", () => {
  test("should return sectors", () => {
    const sectors = getSectors();

    expect(Array.isArray(sectors)).toBe(true);
    expect(sectors.length).toBeGreaterThan(0);
  });

  test("should get one sector", () => {
    const sector = getSectorById(1);

    expect(sector).toBeTruthy();
    expect(sector.id).toBe(1);
  });

  test("should spawn mob in sector", () => {
    const spawn = spawnInSector(1);

    expect(spawn).toBeTruthy();
    expect(spawn.sectorId).toBe(1);
    expect(spawn.mob).toBeTruthy();
  });

  test("should advance world tick", () => {
    const before = getWorld().tick;
    const result = advanceWorldTick();

    expect(result.tick).toBe(before + 1);
    expect(result.spawn).toBeTruthy();
  });
});
