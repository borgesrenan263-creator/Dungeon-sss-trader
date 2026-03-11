function ok(res, payload = {}, status = 200) {
  return res.status(status).json({
    ok: true,
    ...payload
  });
}

function fail(res, error, status = 400, extra = {}) {
  return res.status(status).json({
    ok: false,
    error,
    ...extra
  });
}

module.exports = {
  ok,
  fail
};
