const crypto = require("crypto");

const sessions = new Map();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function now() {
  return Date.now();
}

function generateToken() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "") + crypto.randomBytes(16).toString("hex");
  }

  return crypto.randomBytes(32).toString("hex");
}

function cleanupExpiredSessions() {
  const current = now();

  for (const [token, session] of sessions.entries()) {
    if (!session || session.expiresAt <= current) {
      sessions.delete(token);
    }
  }
}

function createSession(playerName) {
  cleanupExpiredSessions();

  const token = generateToken();
  const createdAt = now();
  const expiresAt = createdAt + SESSION_TTL_MS;

  const session = {
    token,
    playerName,
    createdAt,
    expiresAt
  };

  sessions.set(token, session);

  return session;
}

function getSession(token) {
  if (!token) return null;

  cleanupExpiredSessions();

  const session = sessions.get(token);

  if (!session) return null;

  if (session.expiresAt <= now()) {
    sessions.delete(token);
    return null;
  }

  return session;
}

function revokeSession(token) {
  if (!token) return false;
  return sessions.delete(token);
}

function revokePlayerSessions(playerName) {
  let removed = 0;

  for (const [token, session] of sessions.entries()) {
    if (session && session.playerName === playerName) {
      sessions.delete(token);
      removed += 1;
    }
  }

  return removed;
}

function listPlayerSessions(playerName) {
  cleanupExpiredSessions();

  return Array.from(sessions.values()).filter(
    (session) => session.playerName === playerName
  );
}

function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  const altHeader = req.headers["x-session-token"];
  if (typeof altHeader === "string" && altHeader.trim()) {
    return altHeader.trim();
  }

  return null;
}

module.exports = {
  createSession,
  getSession,
  revokeSession,
  revokePlayerSessions,
  listPlayerSessions,
  extractToken,
  cleanupExpiredSessions
};
