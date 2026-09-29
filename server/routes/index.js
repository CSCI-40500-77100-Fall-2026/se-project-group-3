const express = require("express");

const usersRouter = require("./users");
const songsRouter = require("./songs");

const router = express.Router();

router.use("/users", usersRouter);
router.use("/songs", songsRouter);

module.exports = router;