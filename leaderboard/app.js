const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const routes = require("./routes");
const { sendError } = require("./errors");

dotenv.config({ quiet: true });

const app = express();

app.use(express.json({ limit: "10kb" }));

// Connect once per process. On Vercel a warm function instance reuses this
// connection across requests; Mongoose queues queries until it is open.
mongoose.connect(process.env.MONGO_URI ?? "").catch((error) => {
  console.error("MongoDB connection error:", error.message);
});

app.get("/", (req, res) => {
  res.json({
    service: "cadenza-leaderboard",
    endpoints: [
      "GET /health",
      "POST /scores (x-api-key required)",
      "GET /songs/:songId/leaderboard?limit=10",
      "GET /users/:userId/scores",
    ],
  });
});

app.use(routes);

app.use((req, res) => sendError(res, 404, "not_found", `No route for ${req.method} ${req.path}.`));

// Express 5 forwards errors thrown in async handlers here.
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return sendError(res, 400, "invalid_json", "Request body is not valid JSON.");
  }
  console.error(error);
  return sendError(res, 500, "internal_error", "Something went wrong in the leaderboard service.");
});

module.exports = app;
