const {
  httpRequestsTotal,
  httpRequestDurationMs
} = require("./metrics");

function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const route = req.baseUrl || req.path || "unknown";

    httpRequestsTotal
      .labels(req.method, route, String(res.statusCode))
      .inc();

    httpRequestDurationMs
      .labels(req.method, route, String(res.statusCode))
      .observe(duration);
  });

  next();
}

module.exports = metricsMiddleware;
