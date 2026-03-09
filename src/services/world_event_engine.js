const { randomEvent } = require("../events/world_events");
const { emitWorldEvent } = require("../utils/realtime");

let running = false;

function startWorldEventEngine() {
  if (running) return;

  running = true;

  console.log("🌍 World Event Engine started");

  setInterval(() => {

    const event = randomEvent();

    const payload = {
      ...event,
      timestamp: new Date().toISOString()
    };

    console.log("🌍 EVENT:", payload.type);

    emitWorldEvent("world:event", payload);

  }, 60000); // 1 minuto

}

module.exports = {
  startWorldEventEngine
};
