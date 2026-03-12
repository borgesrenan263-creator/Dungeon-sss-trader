const { EventEmitter } = require("events");

const bus = new EventEmitter();
bus.setMaxListeners(100);

const recentEvents = [];
const MAX_RECENT_EVENTS = 100;

function emitGameEvent(type, payload = {}) {
  const event = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: new Date().toISOString()
  };

  recentEvents.unshift(event);

  if (recentEvents.length > MAX_RECENT_EVENTS) {
    recentEvents.length = MAX_RECENT_EVENTS;
  }

  bus.emit(type, event);
  bus.emit("*", event);

  return event;
}

function onGameEvent(type, handler) {
  bus.on(type, handler);
}

function offGameEvent(type, handler) {
  bus.off(type, handler);
}

function getRecentGameEvents(limit = 30) {
  return recentEvents.slice(0, limit);
}

function getEventStats() {
  const stats = {};

  for (const event of recentEvents) {
    stats[event.type] = (stats[event.type] || 0) + 1;
  }

  return {
    total: recentEvents.length,
    byType: stats
  };
}

module.exports = {
  emitGameEvent,
  onGameEvent,
  offGameEvent,
  getRecentGameEvents,
  getEventStats
};
