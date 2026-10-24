const express = require("express");
const scoresController = require("../../controllers/scoresController");
const authenticate = require("../../middleware/auth");
const router = express.Router();

// The browser only talks to the main server; these routes call the scores
// microservice on its behalf (see services/scoresClient.js).
router.get("/me", authenticate, scoresController.getMyBests);
router.post("/", authenticate, scoresController.submitScore);
router.get("/:songId/top", scoresController.getTopScores);

module.exports = router;
