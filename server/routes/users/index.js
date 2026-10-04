const express = require("express");
const usersController = require("../../controllers/usersController");
const authenticate = require("../../middleware/auth");
const router = express.Router();


router.get("/me", authenticate, usersController.getCurrentUser);
router.post("/signup", usersController.createUser);
router.post("/signin", usersController.signInUser);
router.post("/signout", usersController.signOutUser);


module.exports = router;
