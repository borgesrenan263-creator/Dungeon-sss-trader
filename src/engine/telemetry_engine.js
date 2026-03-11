let telemetry = {
  startedAt: Date.now(),
  worldLoopStarts: 0,
  totalEconomyTicks: 0,
  totalBossSpawns: 0,
  totalGlobalEvents: 0,
  totalMobSpawns: 0
};

function markWorldLoopStarted() {
  telemetry.worldLoopStarts += 1;
}

function markEconomyTick() {
  telemetry.totalEconomyTicks += 1;
}

function markBossSpawn() {
  telemetry.totalBossSpawns += 1;
}

function markGlobalEvent() {
  telemetry.totalGlobalEvents += 1;
}

function markMobSpawn() {
  telemetry.totalMobSpawns += 1;
}

function getTelemetry(worldState) {
  const uptimeSeconds = Math.floor((Date.now() - telemetry.startedAt) / 1000);
  const ticks = worldState?.ticks || 0;

  return {
    uptimeSeconds,
    ticks,
    ticksPerSecond: uptimeSeconds > 0 ? Number((ticks / uptimeSeconds).toFixed(2)) : 0,
    worldLoopStarts: telemetry.worldLoopStarts,
    totalEconomyTicks: telemetry.totalEconomyTicks,
    totalBossSpawns: telemetry.totalBossSpawns,
    totalGlobalEvents: telemetry.totalGlobalEvents,
    totalMobSpawns: telemetry.totalMobSpawns
  };
}

module.exports = {
  markWorldLoopStarted,
  markEconomyTick,
  markBossSpawn,
  markGlobalEvent,
  markMobSpawn,
  getTelemetry
};
