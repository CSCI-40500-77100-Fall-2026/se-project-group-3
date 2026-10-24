const express = require("express");

const usersRouter = require("./users");
const songsRouter = require("./songs");
const scoresRouter = require("./scores");

const router = express.Router();

router.use("/users", usersRouter);
router.use("/songs", songsRouter);
router.use("/scores", scoresRouter);

module.exports = router;
