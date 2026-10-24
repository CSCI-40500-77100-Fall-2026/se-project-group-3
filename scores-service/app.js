const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { connect } = require("./db");
const scoresRouter = require("./routes/scores");

dotenv.config({ quiet: true });

const app = express();
app.use(express.json({ limit: "10kb" }));

// Health check: reports whether this service can reach its own database.
app.get("/health", async (req, res) => {
  try {
    await connect();
    res.json({ status: "ok", database: mongoose.connection.name });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});

app.get("/", (req, res) => {
  res.send("Cadenza scores service is running!");
});

// Every /scores request needs the database; fail fast with 503 if it is down.
app.use("/scores", async (req, res, next) => {
  try {
    await connect();
    next();
  } catch (err) {
    console.error("Scores database unavailable:", err.message);
    res.status(503).json({ message: "Scores database unavailable" });
  }
});
app.use("/scores", scoresRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Express 5 forwards errors thrown in async handlers here.
app.use((err, req, res, _next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Body must be valid JSON" });
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
