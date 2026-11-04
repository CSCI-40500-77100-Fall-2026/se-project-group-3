const express = require("express");
const usersController = require("../../controllers/usersController");
const totpController = require("../../controllers/totpController");
const authenticate = require("../../middleware/auth");
const requirePendingTwoFactor = require("../../middleware/pendingTwoFactor");
const router = express.Router();


router.get("/me", authenticate, usersController.getCurrentUser);
router.post("/signup", usersController.createUser);
router.post("/signin", usersController.signInUser);
router.post("/signout", usersController.signOutUser);

// 2FA setup: user must already be fully logged in
router.post("/totp/setup", authenticate, totpController.setUpTOTP);
router.post("/totp/verify-setup", authenticate, totpController.verifyTOTPSetUp);

// 2FA sign-in step 2: user has only passed the password step
// TODO: add rate limiting here (6-digit codes are brute-forceable)
router.post("/totp/verify-signin", requirePendingTwoFactor, totpController.verifyTOTPSignIn);


module.exports = router;
