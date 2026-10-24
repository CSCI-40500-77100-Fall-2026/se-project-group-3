const express = require("express");
const mongoose = require("mongoose");
const Score = require("./models/Score");
const requireApiKey = require("./middleware/requireApiKey");
const { sendError } = require("./errors");

const router = express.Router();

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function isText(value, max = 100) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function isWholeNumber(value) {
  return Number.isInteger(value) && value >= 0;
}

// Returns a list of problems with a submitted score; empty when it is valid.
function validateScore(body) {
  const problems = [];
  if (!body || typeof body !== "object") return ["Body must be a JSON object."];
  if (!isText(body.scoreId, 64)) problems.push("scoreId must be a non-empty string (max 64 chars).");
  if (!isText(body.userId)) problems.push("userId must be a non-empty string.");
  if (!isText(body.username, 50)) problems.push("username must be a non-empty string (max 50 chars).");
  if (!isText(body.songId)) problems.push("songId must be a non-empty string.");
  if (!isWholeNumber(body.score)) problems.push("score must be a whole number >= 0.");
  if (typeof body.accuracy !== "number" || body.accuracy < 0 || body.accuracy > 100) {
    problems.push("accuracy must be a number from 0 to 100.");
  }
  if (!isWholeNumber(body.maxCombo)) problems.push("maxCombo must be a whole number >= 0.");
  if (typeof body.speed !== "number" || body.speed < 0.25 || body.speed > 2) {
    problems.push("speed must be a number from 0.25 to 2.");
  }
  if (body.playedAt !== undefined && Number.isNaN(Date.parse(body.playedAt))) {
    problems.push("playedAt must be an ISO 8601 date if given.");
  }
  return problems;
}

function parseLimit(raw) {
  if (raw === undefined) return DEFAULT_LIMIT;
  const limit = Number(raw);
  return Number.isInteger(limit) && limit >= 1 && limit <= MAX_LIMIT ? limit : null;
}

// Where a player stands on a song: rank by personal best, out of all players.
async function standingFor(songId, userId) {
  const best = await Score.findOne({ songId, userId }).sort({ score: -1 }).lean();
  if (!best) return null;

  const [counts] = await Score.aggregate([
    { $match: { songId } },
    { $group: { _id: "$userId", best: { $max: "$score" } } },
    {
      $facet: {
        players: [{ $count: "n" }],
        ahead: [{ $match: { best: { $gt: best.score } } }, { $count: "n" }],
      },
    },
  ]);

  return {
    rank: (counts.ahead[0]?.n ?? 0) + 1,
    totalPlayers: counts.players[0]?.n ?? 1,
    bestScore: best.score,
  };
}

router.get("/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "degraded",
    database: connected ? "connected" : "disconnected",
  });
});

router.post("/scores", requireApiKey, async (req, res) => {
  const problems = validateScore(req.body);
  if (problems.length > 0) {
    return sendError(res, 400, "invalid_score", problems.join(" "));
  }

  const { scoreId, userId, username, songId, score, accuracy, maxCombo, speed, playedAt } = req.body;

  // Idempotent on scoreId: a retry of a score we already stored changes nothing.
  const result = await Score.updateOne(
    { scoreId },
    {
      $setOnInsert: {
        scoreId,
        userId,
        username: username.trim(),
        songId,
        score,
        accuracy,
        maxCombo,
        speed,
        playedAt: playedAt ? new Date(playedAt) : new Date(),
      },
    },
    { upsert: true }
  );

  const created = result.upsertedCount === 1;
  res.status(created ? 201 : 200).json({
    scoreId,
    duplicate: !created,
    standing: await standingFor(songId, userId),
  });
});

router.get("/songs/:songId/leaderboard", async (req, res) => {
  const limit = parseLimit(req.query.limit);
  if (limit === null) {
    return sendError(res, 400, "invalid_limit", `limit must be a whole number from 1 to ${MAX_LIMIT}.`);
  }

  // Each player appears once, with their best score; ties go to whoever got there first.
  const rows = await Score.aggregate([
    { $match: { songId: req.params.songId } },
    { $sort: { score: -1, playedAt: 1 } },
    {
      $group: {
        _id: "$userId",
        username: { $first: "$username" },
        score: { $first: "$score" },
        accuracy: { $first: "$accuracy" },
        maxCombo: { $first: "$maxCombo" },
        speed: { $first: "$speed" },
        playedAt: { $first: "$playedAt" },
      },
    },
    { $sort: { score: -1, playedAt: 1 } },
    { $limit: limit },
  ]);

  res.json({
    songId: req.params.songId,
    entries: rows.map(({ _id, ...row }, index) => ({ rank: index + 1, userId: _id, ...row })),
  });
});

router.get("/users/:userId/scores", async (req, res) => {
  // A player's personal best on each song they have played.
  const rows = await Score.aggregate([
    { $match: { userId: req.params.userId } },
    { $sort: { score: -1, playedAt: 1 } },
    {
      $group: {
        _id: "$songId",
        score: { $first: "$score" },
        accuracy: { $first: "$accuracy" },
        maxCombo: { $first: "$maxCombo" },
        speed: { $first: "$speed" },
        playedAt: { $first: "$playedAt" },
        plays: { $sum: 1 },
      },
    },
    { $sort: { playedAt: -1 } },
  ]);

  res.json({
    userId: req.params.userId,
    scores: rows.map(({ _id, ...row }) => ({ songId: _id, ...row })),
  });
});

module.exports = router;
