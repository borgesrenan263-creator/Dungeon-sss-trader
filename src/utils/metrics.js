const client = require("prom-client");

client.collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total de requests HTTP",
  labelNames: ["method", "route", "status_code"]
});

const httpRequestDurationMs = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duração de requests HTTP em ms",
  labelNames: ["method", "route", "status_code"],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2000]
});

module.exports = {
  client,
  httpRequestsTotal,
  httpRequestDurationMs
};
