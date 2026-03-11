const WebSocket = require("ws");

let wss = null;

function safeSend(client, data) {
  if (!client) return;
  if (client.readyState !== WebSocket.OPEN) return;

  try {
    client.send(JSON.stringify(data));
  } catch (err) {
    console.error("WS send error:", err.message);
  }
}

function attachRealtime(server) {
  wss = new WebSocket.Server({ server, path: "/ws" });

  wss.on("connection", (socket) => {
    safeSend(socket, {
      type: "system:welcome",
      payload: {
        ok: true,
        message: "Dungeon SSS Trader realtime connected"
      }
    });

    socket.on("message", (raw) => {
      let parsed = null;

      try {
        parsed = JSON.parse(String(raw));
      } catch {
        return;
      }

      if (parsed?.type === "ping") {
        safeSend(socket, {
          type: "pong",
          payload: { ts: Date.now() }
        });
      }
    });
  });

  return wss;
}

function broadcast(type, payload) {
  if (!wss) return;

  for (const client of wss.clients) {
    safeSend(client, { type, payload });
  }
}

function getRealtimeStats() {
  return {
    enabled: Boolean(wss),
    clients: wss ? wss.clients.size : 0,
    path: "/ws"
  };
}

module.exports = {
  attachRealtime,
  broadcast,
  getRealtimeStats
};
