const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Song = require("../models/Song");

dotenv.config();

const songs = [
  {
    songId: "mary-had-a-little-lamb",
    title: "Mary Had a Little Lamb",
    artist: "Traditional",
    arranger: "cadenza-team",
    coverColor: "#f97362",
    coverImage: "/images/mary-had-a-little-lamb.jpg",
    stars: 1.0,
    length: 32,
    notes: [
      { index: 0, note: "E4", midi: 64, freq_hz: 329.63, start_beat: 0, duration_beats: 1 },
      { index: 1, note: "D4", midi: 62, freq_hz: 293.66, start_beat: 1, duration_beats: 1 },
      { index: 2, note: "C4", midi: 60, freq_hz: 261.63, start_beat: 2, duration_beats: 1 },
      { index: 3, note: "D4", midi: 62, freq_hz: 293.66, start_beat: 3, duration_beats: 1 },
      { index: 4, note: "E4", midi: 64, freq_hz: 329.63, start_beat: 4, duration_beats: 1 },
      { index: 5, note: "E4", midi: 64, freq_hz: 329.63, start_beat: 5, duration_beats: 1 },
      { index: 6, note: "E4", midi: 64, freq_hz: 329.63, start_beat: 6, duration_beats: 2 },
      { index: 7, note: "D4", midi: 62, freq_hz: 293.66, start_beat: 8, duration_beats: 1 },
      { index: 8, note: "D4", midi: 62, freq_hz: 293.66, start_beat: 9, duration_beats: 1 },
      { index: 9, note: "D4", midi: 62, freq_hz: 293.66, start_beat: 10, duration_beats: 2 },
      { index: 10, note: "E4", midi: 64, freq_hz: 329.63, start_beat: 12, duration_beats: 1 },
      { index: 11, note: "G4", midi: 67, freq_hz: 392.0, start_beat: 13, duration_beats: 1 },
      { index: 12, note: "G4", midi: 67, freq_hz: 392.0, start_beat: 14, duration_beats: 2 },
      { index: 13, note: "E4", midi: 64, freq_hz: 329.63, start_beat: 16, duration_beats: 1 },
      { index: 14, note: "D4", midi: 62, freq_hz: 293.66, start_beat: 17, duration_beats: 1 },
      { index: 15, note: "C4", midi: 60, freq_hz: 261.63, start_beat: 18, duration_beats: 1 },
      { index: 16, note: "D4", midi: 62, freq_hz: 293.66, start_beat: 19, duration_beats: 1 },
      { index: 17, note: "E4", midi: 64, freq_hz: 329.63, start_beat: 20, duration_beats: 1 },
      { index: 18, note: "E4", midi: 64, freq_hz: 329.63, start_beat: 21, duration_beats: 1 },
      { index: 19, note: "E4", midi: 64, freq_hz: 329.63, start_beat: 22, duration_beats: 1 },
      { index: 20, note: "E4", midi: 64, freq_hz: 329.63, start_beat: 23, duration_beats: 1 },
      { index: 21, note: "D4", midi: 62, freq_hz: 293.66, start_beat: 24, duration_beats: 1 },
      { index: 22, note: "D4", midi: 62, freq_hz: 293.66, start_beat: 25, duration_beats: 1 },
      { index: 23, note: "E4", midi: 64, freq_hz: 329.63, start_beat: 26, duration_beats: 1 },
      { index: 24, note: "D4", midi: 62, freq_hz: 293.66, start_beat: 27, duration_beats: 1 },
      { index: 25, note: "C4", midi: 60, freq_hz: 261.63, start_beat: 28, duration_beats: 4 },
    ],
  },
  {
    songId: "seasons",
    title: "Seasons",
    artist: "wave to earth",
    arranger: "cadenza-team",
    coverColor: "#5ec8f8",
    coverImage: "/images/seasons.jpg",
    stars: 3.2,
    length: 229,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  for (const song of songs) {
    await Song.findOneAndUpdate({ songId: song.songId }, song, {
      upsert: true,
      returnDocument: "after",
    });
    console.log(`Seeded: ${song.title}`);
  }

  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
