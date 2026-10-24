const express = require("express");
const Score = require("../models/Score");
const BestScore = require("../models/BestScore");
const requireApiKey = require("../middleware/requireApiKey");

const router = express.Router();

const MAX_LIMIT = 50;
const DUPLICATE_KEY = 11000;

function parseLimit(value, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, MAX_LIMIT);
}

function isNonEmptyString(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function isNumberInRange(value, min, max) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function validate(body) {
  const { submissionId, userId, username, songId, score, maxCombo = 0, accuracy = 0, speed = 1 } = body;
  const errors = [];
  if (!isNonEmptyString(submissionId, 100)) errors.push("submissionId is required");
  if (!isNonEmptyString(userId, 100)) errors.push("userId is required");
  if (!isNonEmptyString(username, 100)) errors.push("username is required");
  if (!isNonEmptyString(songId, 100)) errors.push("songId is required");
  if (!isNumberInRange(score, 0, 1e9)) errors.push("score must be a number from 0 to 1,000,000,000");
  if (!isNumberInRange(maxCombo, 0, 1e6)) errors.push("maxCombo must be a non-negative number");
  if (!isNumberInRange(accuracy, 0, 100)) errors.push("accuracy must be a number from 0 to 100");
  if (!isNumberInRange(speed, 0.01, 10)) errors.push("speed must be a number from 0.01 to 10");
  return {
    errors,
    run: {
      submissionId,
      userId,
      username,
      songId,
      score: Math.round(score),
      maxCombo: Math.round(maxCombo),
      accuracy: Math.round(accuracy * 100) / 100,
      speed,
    },
  };
}

// Raise the player's best for this song if this run beats it. The filter only
// matches a best with a LOWER score; if the stored best is higher (or equal),
// the upsert tries to insert a second (userId, songId) document, the unique
// index rejects it, and we keep the existing best.
async function updateBest(run, achievedAt) {
  try {
    await BestScore.updateOne(
      { userId: run.userId, songId: run.songId, score: { $lt: run.score } },
      {
        $set: {
          username: run.username,
          score: run.score,
          maxCombo: run.maxCombo,
          accuracy: run.accuracy,
          speed: run.speed,
          achievedAt,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    if (err.code !== DUPLICATE_KEY) throw err;
  }
}

// POST /scores (private): record one finished game.
router.post("/", requireApiKey, async (req, res) => {
  const { errors, run } = validate(req.body ?? {});
  if (errors.length > 0) {
    return res.status(400).json({ message: "Invalid score", errors });
  }

  // Keyed on submissionId: if the main server retries after a timeout, the
  // retry finds the first attempt's document instead of storing a duplicate.
  const saved = await Score.findOneAndUpdate(
    { submissionId: run.submissionId },
    { $setOnInsert: run },
    { upsert: true, returnDocument: "after" }
  ).lean();

  // Use the stored run, so a retry with different numbers can't change anything.
  await updateBest(saved, saved.createdAt);

  const best = await BestScore.findOne({ userId: saved.userId, songId: saved.songId }).lean();
  const higher = await BestScore.countDocuments({ songId: saved.songId, score: { $gt: best.score } });

  res.status(201).json({
    score: saved,
    personalBest: best.score,
    isPersonalBest: best.score === saved.score,
    rank: higher + 1,
  });
});

// GET /scores/:songId/top?limit=10 (public): each player's best run on a song, ranked.
router.get("/:songId/top", async (req, res) => {
  const limit = parseLimit(req.query.limit, 10);

  const bests = await BestScore.find({ songId: req.params.songId })
    .sort({ score: -1, achievedAt: 1 })
    .limit(limit)
    .select("-_id username score maxCombo accuracy speed achievedAt")
    .lean();

  res.json({
    songId: req.params.songId,
    scores: bests.map((best, index) => ({ rank: index + 1, ...best })),
  });
});

// GET /scores/users/:userId/best (private): a user's best score on every song they played.
router.get("/users/:userId/best", requireApiKey, async (req, res) => {
  const bests = await BestScore.find({ userId: req.params.userId })
    .sort({ songId: 1 })
    .select("-_id songId score maxCombo accuracy speed achievedAt")
    .lean();

  res.json({ userId: req.params.userId, bests });
});

module.exports = router;
