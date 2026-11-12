const express = require("express");
const os = require("os");
const songsController = require("../../controllers/songsController");
const scoresController = require("../../controllers/scoresController");
const router = express.Router();
const multer = require("multer");

const upload = multer({ dest: os.tmpdir() });


router.get("/", songsController.getSongs);
router.get("/:songId/leaderboard", scoresController.getSongLeaderboard);
router.post("/upload", upload.single("audio"), songsController.uploadSong);

module.exports = router;