const express = require("express");
const usersController = require("../../controllers/usersController");
const router = express.Router();


router.get("/", usersController.getUser);
router.post("/signup", usersController.createUser);

module.exports = router;
