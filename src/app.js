require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pinoHttp = require("pino-http");

const logger = require("./utils/logger");
const routes = require("./api/routes");
const metricsMiddleware = require("./utils/metricsMiddleware");
const { client } = require("./utils/metrics");
const cache = require("./utils/cache");

const app = express();

app.use(pinoHttp({ logger }));
app.use(metricsMiddleware);

app.use(helmet());
app.use(cors());

app.use(express.json({ limit: "300kb" }));
app.use(express.urlencoded({ extended: true, limit: "300kb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "too_many_requests"
  }
});

app.use(limiter);
app.use(express.static("public"));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    server: "running",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    cache: {
      keys: cache.keys().length,
      stats: cache.getStats()
    },
    lastEvent: cache.get("world:last_event") || null
  });
});

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

app.use("/", routes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "route_not_found",
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  logger.error({ err }, "GLOBAL_ERROR");

  res.status(err.status || 500).json({
    ok: false,
    error: err.message || "internal_server_error"
  });
});

module.exports = app;
