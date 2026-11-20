const jwt = require("jsonwebtoken")
const { PENDING_COOKIE, PENDING_PURPOSE } = require("../utils/authCookie")

// guards the 2nd step of 2FA (verifyTOTPSignIn).
// only lets the request through if the user passed the password step in the last 5 minutes,
// i.e. they hold a valid pending2fa cookie (set by signInUser)
const requirePendingTwoFactor = (req, res, next) => {
  const token = req.cookies[PENDING_COOKIE]

  if (!token) {
    return res.status(401).json({ message: "Sign in with your password first" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // a normal login token has no purpose claim, so it can't be used here
    if (decoded.purpose !== PENDING_PURPOSE) {
      return res.status(401).json({ message: "Invalid token" })
    }

    req.userId = decoded.userId
    next()
  } catch (err) {
    // expired (> 5 min) or tampered with
    return res.status(401).json({ message: "Sign in session expired, please sign in again" })
  }
}

module.exports = requirePendingTwoFactor
