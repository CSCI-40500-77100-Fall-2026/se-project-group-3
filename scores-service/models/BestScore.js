const mongoose = require("mongoose");

// One document per (player, song): that player's best run. Kept up to date on
// every submission so a leaderboard is a single indexed query.
const bestScoreSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    songId: { type: String, required: true },
    username: { type: String, required: true },
    score: { type: Number, required: true, min: 0 },
    maxCombo: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    speed: { type: Number, default: 1 },
    achievedAt: { type: Date, required: true },
  },
  { versionKey: false }
);

bestScoreSchema.index({ userId: 1, songId: 1 }, { unique: true });
bestScoreSchema.index({ songId: 1, score: -1, achievedAt: 1 });

module.exports = mongoose.model("BestScore", bestScoreSchema);
