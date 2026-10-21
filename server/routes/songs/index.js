const express = require("express");
const os = require("os");
const songsController = require("../../controllers/songsController");
const router = express.Router();
const multer = require("multer");

const upload = multer({ dest: os.tmpdir() });


router.get("/", songsController.getSongs);
router.post("/upload", upload.single("audio"), songsController.uploadSong);

module.exports = router;