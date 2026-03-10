const { chooseSchool, getPlayerSchool } = require("../src/domain/player/school.system");

describe("School System", () => {

  test("player should choose school", () => {

    const result = chooseSchool(1,"Knight");

    expect(result.ok).toBe(true);
    expect(getPlayerSchool(1)).toBe("Knight");

  });

});
