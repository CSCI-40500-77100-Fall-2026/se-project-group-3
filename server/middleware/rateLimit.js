const rateLimit = require("express-rate-limit")

// limits wrong 2FA codes on /users/totp/verify-signin.
// a 6-digit code has 1,000,000 options; without a limit, someone who already has
// the password could guess the code in a few hours.
//
// must run AFTER requirePendingTwoFactor, because it counts per user (req.userId),
// not per IP: an attacker targets one account, and might use many IPs.
// signing in again with the password gives a new pending cookie but the same userId,
// so it doesn't reset the counter.
//
// note: the count lives in memory, so it resets on server restart, and each
// Vercel instance keeps its own count. good enough for this project; a shared
// store (e.g. Redis) would make it strict.
const totpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 5,                // 5 wrong codes per user per window
  skipSuccessfulRequests: true, // only failed attempts count; a correct code doesn't use one up
  keyGenerator: (req) => String(req.userId),
  standardHeaders: "draft-7", // tells the client how long to wait (RateLimit / Retry-After headers)
  legacyHeaders: false,
  message: { message: "Too many attempts. Please wait a few minutes and try again." },
  // we key by userId, not IP, so the proxy/IP checks don't apply here
  validate: { xForwardedForHeader: false },
})

module.exports = { totpVerifyLimiter }
