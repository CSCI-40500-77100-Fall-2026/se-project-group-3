const crypto = require("crypto");

// Only the main Cadenza server knows SCORES_API_KEY, so only it can write
// scores or read a specific user's history. The browser never calls these.
function requireApiKey(req, res, next) {
  const expected = process.env.SCORES_API_KEY;
  if (!expected) {
    return res.status(500).json({ message: "SCORES_API_KEY is not configured" });
  }

  const given = req.get("x-api-key") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ message: "Invalid or missing API key" });
  }
  next();
}

module.exports = requireApiKey;
