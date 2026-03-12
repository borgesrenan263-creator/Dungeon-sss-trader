const ipHits = new Map();

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Origin-Agent-Cluster", "?1");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("X-XSS-Protection", "0");
  next();
}

function simpleCors(req, res, next) {
  const origin = req.headers.origin || "";
  const allowed = [
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
    /^http:\/\/localhost(:\d+)?$/,
    /^https:\/\/.*onrender\.com$/
  ];

  const isAllowed = !origin || allowed.some((rule) => rule.test(origin));

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
}

function simpleRateLimit(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 120;

  return function rateLimitMiddleware(req, res, next) {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";

    const now = Date.now();
    const entry = ipHits.get(ip) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    ipHits.set(ip, entry);

    res.setHeader("RateLimit-Policy", `${max};w=${Math.floor(windowMs / 1000)}`);
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil((entry.resetAt - now) / 1000)));

    if (entry.count > max) {
      return res.status(429).json({
        ok: false,
        error: "rate_limit_exceeded"
      });
    }

    next();
  };
}

module.exports = {
  securityHeaders,
  simpleCors,
  simpleRateLimit
};
