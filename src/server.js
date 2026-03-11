const express = require("express");
const routes = require("./api/routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());
app.use("/", routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
