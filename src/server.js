const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const logger = require("./utils/logger");
const { setIO } = require("./utils/realtime");
const { startAIGameDirector } = require("./services/ai_game_director");

const PORT = process.env.PORT || 8787;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

setIO(io);

io.on("connection", (socket) => {
  logger.info(`socket connected: ${socket.id}`);

  socket.emit("server:hello", {
    ok: true,
    message: "realtime online",
    socketId: socket.id
  });

  socket.on("disconnect", () => {
    logger.info(`socket disconnected: ${socket.id}`);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server running on port ${PORT}`);
  startAIGameDirector();
});
