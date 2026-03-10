function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollChance(percent) {
  return Math.random() * 100 <= percent;
}

module.exports = {
  randomInt,
  rollChance
};
