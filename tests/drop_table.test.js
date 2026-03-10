const { rollDrop, DROP_TABLE } = require("../src/engine/drop_table");

describe("Drop Table", () => {
  test("should have drops for slime", () => {
    expect(DROP_TABLE.Slime.length).toBeGreaterThan(0);
  });

  test("should roll one valid drop", () => {
    const drop = rollDrop("Slime");

    expect(drop.name).toBeTruthy();
    expect(drop.type).toBeTruthy();
  });
});
