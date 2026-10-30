const mongoose = require("mongoose");

// Outbox: scores that could not be delivered to the leaderboard service.
// They are re-sent later, so the leaderboard eventually receives every score.
const pendingScoreSchema = new mongoose.Schema(
  {
    scoreId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    songId: { type: String, required: true },
    score: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    maxCombo: { type: Number, required: true },
    speed: { type: Number, required: true },
    playedAt: { type: String, required: true },
    attempts: { type: Number, default: 1 },
    lastError: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PendingScore", pendingScoreSchema);
