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
      new: true,
    });
    console.log(`Seeded: ${song.title}`);
  }

  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
