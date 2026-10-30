const crypto = require("crypto");
const { sendError } = require("../errors");

// Writes are only accepted from the Cadenza API, which knows who the player is.
function requireApiKey(req, res, next) {
  const expected = process.env.API_KEY;
  if (!expected) {
    return sendError(res, 503, "not_configured", "The service has no API_KEY set.");
  }

  const given = req.get("x-api-key") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return sendError(res, 401, "unauthorized", "A valid x-api-key header is required.");
  }

  next();
}

module.exports = requireApiKey;
