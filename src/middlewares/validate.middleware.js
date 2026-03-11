const { fail } = require("../utils/api.response");

function requireBodyFields(fields = []) {
  return (req, res, next) => {
    const body = req.body || {};

    for (const field of fields) {
      const value = body[field];

      if (value === undefined || value === null || value === "") {
        return fail(res, "validation_error", 400, {
          field,
          message: `missing required field: ${field}`
        });
      }
    }

    next();
  };
}

function requireNumericBodyFields(fields = []) {
  return (req, res, next) => {
    const body = req.body || {};

    for (const field of fields) {
      const value = body[field];

      if (typeof value !== "number" || Number.isNaN(value)) {
        return fail(res, "validation_error", 400, {
          field,
          message: `field must be numeric: ${field}`
        });
      }
    }

    next();
  };
}

module.exports = {
  requireBodyFields,
  requireNumericBodyFields
};
