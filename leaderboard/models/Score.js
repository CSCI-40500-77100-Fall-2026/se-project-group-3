const mongoose = require("mongoose");

// One document per finished game. The username is a copy taken when the score
// was submitted: this service has no access to the main application's users.
const scoreSchema = new mongoose.Schema(
  {
    scoreId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    songId: { type: String, required: true },
    score: { type: Number, required: true, min: 0 },
    accuracy: { type: Number, required: true, min: 0, max: 100 },
    maxCombo: { type: Number, required: true, min: 0 },
    speed: { type: Number, required: true },
    playedAt: { type: Date, required: true },
  },
  { versionKey: false }
);

scoreSchema.index({ songId: 1, score: -1 });

module.exports = mongoose.model("Score", scoreSchema);
