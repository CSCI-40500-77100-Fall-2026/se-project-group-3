const express = require("express");
const scoresController = require("../../controllers/scoresController");
const authenticate = require("../../middleware/auth");

const router = express.Router();

router.post("/", authenticate, scoresController.submitScore);

module.exports = router;
