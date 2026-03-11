function getWorldAnalytics(worldState, apiState) {
  const ticks = worldState.ticks || 0;
  const mobsSpawned = worldState.mobsSpawned || 0;
  const globalEvents = Array.isArray(worldState.globalEvents) ? worldState.globalEvents.length : 0;
  const marketListings = apiState.market?.listings?.length || 0;
  const onlinePlayers = Object.keys(apiState.onlinePlayers || {}).length;

  const spawnRate = ticks > 0 ? Number((mobsSpawned / ticks).toFixed(2)) : 0;
  const eventRate = ticks > 0 ? Number((globalEvents / ticks).toFixed(2)) : 0;

  return {
    ticks,
    mobsSpawned,
    globalEvents,
    marketListings,
    onlinePlayers,
    spawnRate,
    eventRate
  };
}

module.exports = {
  getWorldAnalytics
};
