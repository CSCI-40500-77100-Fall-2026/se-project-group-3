const mongoose = require("mongoose");

// Every finished game (the full history). userId, username and songId are copies of
// values owned by the main application; this service never reads its database.
const scoreSchema = new mongoose.Schema(
  {
    // Sent by the caller so a retried request is stored once, not twice.
    submissionId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    songId: { type: String, required: true },
    score: { type: Number, required: true, min: 0 },
    maxCombo: { type: Number, default: 0, min: 0 },
    accuracy: { type: Number, default: 0, min: 0, max: 100 },
    speed: { type: Number, default: 1, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

scoreSchema.index({ userId: 1, songId: 1 });

module.exports = mongoose.model("Score", scoreSchema);
