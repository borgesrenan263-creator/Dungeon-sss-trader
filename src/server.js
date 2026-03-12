const express = require("express");
const path = require("path");
const routes = require("./api/routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");
const {
  securityHeaders,
  simpleCors,
  simpleRateLimit
} = require("./middlewares/security.middleware");

const app = express();

app.disable("x-powered-by");

app.use(securityHeaders);
app.use(simpleCors);
app.use(simpleRateLimit({ windowMs: 60 * 1000, max: 120 }));

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));

app.use(express.static(path.join(process.cwd(), "public"), {
  etag: true,
  maxAge: "5m"
}));

app.use("/", routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
