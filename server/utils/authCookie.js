// helper functions for setting and deleting authorization cookies
// this is an addition after we have decided to implement 2FA
// both ../controllers/usersController.js signInUser() and ../controllers/totpController.js verifyTOTPSignIn
// need to set and delete auth cookies
// these helper functions are here to avoid redundancy in code
//
// Bimukti

const jwt = require("jsonwebtoken")

const AUTH_COOKIE = "token"
const PENDING_COOKIE = "pending2fa"
const PENDING_PURPOSE = "2fa"

// cookie options shared by every set/clear call.
// a browser only deletes a cookie when clearCookie gets the same options it was set with,
// so they live in one place
function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production"
  return {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
  }
}

// no try/catch in here on purpose: errors (e.g. missing JWT_SECRET) bubble up
// to the calling controller's catch, which sends the 500

// full login: issued after password (and TOTP, if enabled) are verified
function setAuthCookie(res, userId) {
  const token = jwt.sign(
    { userId: userId },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  )

  res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), maxAge: 24 * 60 * 60 * 1000 })
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions())
}

// "password was correct, waiting for TOTP code": short lived, only accepted by
// middleware/pendingTwoFactor.js. the purpose claim is what stops it from being
// used as a full login token (middleware/auth.js rejects any token that has one)
function setPendingCookie(res, userId) {
  const token = jwt.sign(
    { userId: userId, purpose: PENDING_PURPOSE },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  )

  res.cookie(PENDING_COOKIE, token, { ...cookieOptions(), maxAge: 5 * 60 * 1000 })
}

function clearPendingCookie(res) {
  res.clearCookie(PENDING_COOKIE, cookieOptions())
}

module.exports = {
  AUTH_COOKIE,
  PENDING_COOKIE,
  PENDING_PURPOSE,
  setAuthCookie,
  clearAuthCookie,
  setPendingCookie,
  clearPendingCookie,
}
