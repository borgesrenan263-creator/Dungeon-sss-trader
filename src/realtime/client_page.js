function renderRealtimePage(wsUrl) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Dungeon SSS Trader Realtime</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #0f172a;
          color: #e2e8f0;
          margin: 0;
          padding: 20px;
        }
        h1 {
          margin-top: 0;
        }
        .card {
          background: #111827;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        .ok {
          color: #22c55e;
          font-weight: bold;
        }
        .log {
          background: #020617;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 12px;
          min-height: 280px;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
        button {
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 14px;
          margin-right: 8px;
        }
      </style>
    </head>
    <body>
      <h1>⚡ Dungeon SSS Trader Realtime</h1>

      <div class="card">
        <p>WebSocket URL: <span class="ok">${wsUrl}</span></p>
        <button onclick="sendPing()">Send Ping</button>
        <button onclick="clearLog()">Clear Log</button>
      </div>

      <div class="card">
        <h2>Status</h2>
        <p id="status">Connecting...</p>
      </div>

      <div class="card">
        <h2>Realtime Events</h2>
        <div id="log" class="log"></div>
      </div>

      <script>
        const wsUrl = ${JSON.stringify(wsUrl)};
        const statusEl = document.getElementById("status");
        const logEl = document.getElementById("log");

        const ws = new WebSocket(wsUrl);

        function appendLog(message) {
          const now = new Date().toLocaleTimeString();
          logEl.textContent = "[" + now + "] " + message + "\\n\\n" + logEl.textContent;
        }

        function clearLog() {
          logEl.textContent = "";
        }

        function sendPing() {
          ws.send(JSON.stringify({ type: "ping" }));
        }

        ws.onopen = () => {
          statusEl.textContent = "Connected";
          statusEl.className = "ok";
          appendLog("connected");
        };

        ws.onmessage = (event) => {
          appendLog(event.data);
        };

        ws.onclose = () => {
          statusEl.textContent = "Disconnected";
          statusEl.className = "";
          appendLog("disconnected");
        };

        ws.onerror = () => {
          statusEl.textContent = "Error";
          statusEl.className = "";
          appendLog("socket error");
        };
      </script>
    </body>
  </html>
  `;
}

module.exports = {
  renderRealtimePage
};
