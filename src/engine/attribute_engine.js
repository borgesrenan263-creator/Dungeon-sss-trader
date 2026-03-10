function createBaseAttributes() {
  return {
    str: 10,
    dex: 5,
    int: 5,
    vit: 10
  };
}

function calculateDerivedStats(attributes) {
  return {
    atk: attributes.str * 2 + attributes.dex,
    skillPower: attributes.int * 2,
    hp: attributes.vit * 10
  };
}

module.exports = {
  createBaseAttributes,
  calculateDerivedStats
};
