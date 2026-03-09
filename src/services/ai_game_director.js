const { buildRandomWorldEvent } = require("../events/world_events");
const { emitWorldEvent } = require("../utils/realtime");
const cache = require("../utils/cache");

let directorRunning = false;
let intervalRef = null;

function startAIGameDirector() {
  if (directorRunning) return;

  directorRunning = true;

  console.log("🧠 AI Game Director started");

  intervalRef = setInterval(() => {
    const event = buildRandomWorldEvent();

    const history = cache.get("world:event_history") || [];
    history.unshift(event);

    cache.set("world:event_history", history.slice(0, 20), 3600);
    cache.set("world:last_event", event, 3600);

    console.log("🧠 DIRECTOR EVENT:", event.type, "-", event.sector);

    emitWorldEvent("world:event", event);
  }, 60000);
}

function stopAIGameDirector() {
  if (intervalRef) {
    clearInterval(intervalRef);
    intervalRef = null;
  }

  directorRunning = false;
}

function getDirectorStatus() {
  return {
    running: directorRunning,
    lastEvent: cache.get("world:last_event") || null,
    historyCount: (cache.get("world:event_history") || []).length
  };
}

module.exports = {
  startAIGameDirector,
  stopAIGameDirector,
  getDirectorStatus
};
