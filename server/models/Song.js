const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    index: Number,
    note: String,
    midi: Number,
    freq_hz: Number,
    start_beat: Number,
    duration_beats: Number,
  },
  { _id: false }
);

const songSchema = new mongoose.Schema({
  songId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  arranger: { type: String, required: true },
  coverColor: { type: String, required: true },
  coverImage: { type: String, required: true },
  stars: { type: Number, required: true },
  length: { type: Number, required: true },
  notes: [noteSchema],
});

const Song = mongoose.model("Song", songSchema);

module.exports = Song;
