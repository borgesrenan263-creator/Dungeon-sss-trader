const NodeCache = require("node-cache");

const cache = new NodeCache({
  stdTTL: 20,
  checkperiod: 60,
  useClones: false
});

module.exports = cache;
