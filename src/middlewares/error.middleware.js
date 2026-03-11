const { fail } = require("../utils/api.response");

function notFoundHandler(req, res, next) {
  return fail(res, "route_not_found", 404, {
    path: req.originalUrl,
    method: req.method
  });
}

function errorHandler(err, req, res, next) {
  console.error("[API ERROR]", {
    message: err?.message,
    stack: err?.stack,
    path: req?.originalUrl,
    method: req?.method
  });

  return fail(res, "internal_error", 500, {
    message: err?.message || "unexpected error"
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
