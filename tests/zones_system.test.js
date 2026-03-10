const { canEnterZone, recommendZone } = require("../src/domain/world/zones.engine");

describe("Zones System", () => {

  test("player should not enter high level zone", () => {

    const player = { level:5 };

    const result = canEnterZone(player,4);

    expect(result.ok).toBe(false);

  });

  test("zone recommendation should work", () => {

    const player = { level:30 };

    const zone = recommendZone(player);

    expect(zone.name).toBeDefined();

  });

});
