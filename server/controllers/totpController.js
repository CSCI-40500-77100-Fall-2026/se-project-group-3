const User = require("../models/User") // import User
// otplib is loaded with a dynamic import() instead of require():
// otplib's CommonJS build require()s @scure/base, which is ESM-only. Vercel's runtime
// can't require() ESM, so a top-level require("otplib") crashed the whole API on startup.
// import() works from CommonJS and loads otplib's ESM build instead.
// it's loaded once, on first use, and cached.
let otplibPromise
const loadOtplib = () => {
  if (!otplibPromise) {
    otplibPromise = import("otplib")
  }
  return otplibPromise
}

const QRCode = require("qrcode")
const { encrypt, decrypt } = require("../utils/encryption")
const { setAuthCookie, clearPendingCookie } = require("../utils/authCookie")


const setUpTOTP = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: "user not found" })
    }

    // now check if user's totp is alr enabled, if it is, dont declare a new one
    if (user.totpEnabled) {
      return res.status(400).json({ message: "two factor authentication is already enabled " })
    }

    // generate secret. generateSecret is imported from otplib
    const { generateSecret, generateURI } = await loadOtplib()
    const secret = generateSecret()
    // encrypt the secret and save it in the database
    user.totpSecret = encrypt(secret)
    await user.save()


    //otpauth
    const otpauthUrl = generateURI({ issuer: "Cadenza", label: user.username, secret })
    const qrCode = await QRCode.toDataURL(otpauthUrl)

    // we are sending the secret so that the user can type it in
    // if they can't access their camera. 
    // its only sent once
    return res.status(200).json({ qrCode, secret })
  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: "Internal server error." })
  }
}

// we need two more controllers: verifyTOTPSetUp --> checks if the the secret is working, run it one time per user
// and verifyTOTPSingIn --> the 2nd step of 2FA
// both functions will need to load the encrypted secret from the database, decrypt it, then verify the TOTP
// to avoid redundancy: we declare a helper 

const checkTOTP = async (user, token) => {
  if (typeof token !== "string") {
    return false // type mismatch
  }

  if (!user.totpSecret) {
    // database does not have the secret, nothing to do and return False
    //
    return false
  }

  // outside the try below on purpose: if otplib fails to load, that's a server error (500),
  // not an "invalid code"
  const { verify } = await loadOtplib()

  let secret

  try {
    secret = decrypt(user.totpSecret)
  } catch {
    return false
  }

  let result
  try {
    result = await verify({
      secret,
      token,
      epochTolerance: 10,          // accept codes a little too late --> check google authenticator documentation for clarification
      afterTimeStep: user.lastUsed // reject codes from an already-used step; never accept the same code twice --> industry standard
    })
  } catch {
    return false
  }

  if (!result.valid) {
    return false
  }

  user.lastUsed = result.timeStep
  await user.save()

  return true
}

// this runs the first time user enters the code from their authenticator 
// we use this to verify if the TOTP was set up properly
// if the code is verified true, we update req.totpEnabled to true 
const verifyTOTPSetUp = async (req, res) => {
  try {
    const code = req.body.code
    const user = await User.findById(req.userId)

    if (!user) {
      return res.status(404).json({ message: "user not found" })
    }

    if (user.totpEnabled) {
      return res.status(400).json({ message: "two factor authentication is already enabled" })
    }

    const validCode = await checkTOTP(user, code)

    if (!validCode) {
      return res.status(401).json({ message: "Invalid Code." })
    }

    // if the prev condition is not satisfied: that means it is a valid code. 

    user.totpEnabled = true

    await user.save()

    return res.status(200).json({ message: "Two factor authentication activated" })
  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}


// verification function 2: verifyTOTPSignIn
// this is the 2nd step of 2FA, verifies user provided token
// runs behind middleware/pendingTwoFactor.js, which sets req.userId
// only if the password step passed in the last 5 minutes

const verifyTOTPSignIn = async (req, res) => {
  try {
    const code = req.body.code
    const user = await User.findById(req.userId)

    if (!user) {
      return res.status(404).json({ message: "user not found" })
    }

    // a user who started setup but never verified it must not sign in with a code
    if (!user.totpEnabled) {
      return res.status(400).json({ message: "two factor authentication is not enabled" })
    }

    const validCode = await checkTOTP(user, code)

    if (!validCode) {
      return res.status(401).json({ message: "Invalid code." })
    }

    // valid code: swap the pending cookie for a real login cookie
    clearPendingCookie(res)
    setAuthCookie(res, user._id)

    // same shape as signInUser's response so the frontend handles both the same way
    return res.status(200).json({ message: "Sign in successful", user: user })
  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: "Internal server error" })
  }
}


module.exports = { setUpTOTP, verifyTOTPSetUp, verifyTOTPSignIn }
