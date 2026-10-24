const crypto = require("crypto");
const User = require("../models/User");
const Song = require("../models/Song");
const PendingScore = require("../models/PendingScore");
const leaderboard = require("../services/leaderboardClient");

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const BASE_POINTS_PER_BEAT = 100;
const MAX_MULTIPLIER = 4;
const OUTBOX_BATCH = 10;
const DEFAULT_LIMIT = 10;

// Highest score a song can produce at a speed: every note Perfect at the top
// multiplier. Mirrors the scoring in client/src/components/Game.jsx.
function maxPossibleScore(song, speed) {
  return song.notes.reduce(
    (total, note) =>
      total + Math.round(BASE_POINTS_PER_BEAT * (note.duration_beats ?? 1) * MAX_MULTIPLIER * speed),
    0
  );
}

function toPayload(entry) {
  const { scoreId, userId, username, songId, score, accuracy, maxCombo, speed, playedAt } = entry;
  return { scoreId, userId, username, songId, score, accuracy, maxCombo, speed, playedAt };
}

// Re-send scores that missed an earlier outage. Called right after a successful
// call, i.e. when the service is known to be up. Stops at the first sign it is
// down again so a request never waits on more than one failed delivery.
// Returns how many pending scores were delivered.
async function flushOutbox() {
  const pending = await PendingScore.find().sort({ createdAt: 1 }).limit(OUTBOX_BATCH);
  let delivered = 0;
  for (const entry of pending) {
    try {
      await leaderboard.submitScore(toPayload(entry));
      await PendingScore.deleteOne({ _id: entry._id });
      delivered += 1;
    } catch (error) {
      if (error instanceof leaderboard.LeaderboardUnavailableError) {
        await PendingScore.updateOne(
          { _id: entry._id },
          { $inc: { attempts: 1 }, $set: { lastError: error.message } }
        );
        break;
      }
      // The service rejected it outright; retrying would never succeed.
      console.error(`Dropping pending score ${entry.scoreId}:`, error.message);
      await PendingScore.deleteOne({ _id: entry._id });
    }
  }
  return delivered;
}

async function flushOutboxQuietly() {
  try {
    return await flushOutbox();
  } catch (error) {
    console.error("Outbox flush failed:", error.message);
    return 0;
  }
}

// POST /scores — save a finished game for the logged-in player.
const submitScore = async (req, res) => {
  const { songId, score, accuracy, maxCombo, speed } = req.body ?? {};

  if (
    typeof songId !== "string" ||
    !Number.isInteger(score) ||
    score < 0 ||
    typeof accuracy !== "number" ||
    accuracy < 0 ||
    accuracy > 100 ||
    !Number.isInteger(maxCombo) ||
    maxCombo < 0 ||
    !SPEED_OPTIONS.includes(speed)
  ) {
    return res.status(400).json({ message: "Invalid score submission." });
  }

  const song = await Song.findOne({ songId });
  if (!song) {
    return res.status(404).json({ message: "Song not found." });
  }
  if (!song.notes?.length) {
    return res.status(422).json({ message: "Scores aren't saved for this song yet." });
  }
  if (score > maxPossibleScore(song, speed) || maxCombo > song.notes.length) {
    return res.status(422).json({ message: "That score isn't possible for this song." });
  }

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const entry = {
    scoreId: crypto.randomUUID(),
    userId: String(user._id),
    username: user.username,
    songId,
    score,
    accuracy: Math.round(accuracy * 100) / 100,
    maxCombo,
    speed,
    playedAt: new Date().toISOString(),
  };

  try {
    let result = await leaderboard.submitScore(entry);
    if ((await flushOutboxQuietly()) > 0) {
      // Delivered scores may have changed this player's rank. Re-sending the same
      // scoreId stores nothing new (the service is idempotent) but returns fresh standing.
      result = await leaderboard.submitScore(entry).catch(() => result);
    }
    return res.status(201).json({ saved: true, ...result.standing });
  } catch (error) {
    if (error instanceof leaderboard.LeaderboardUnavailableError) {
      await PendingScore.create({ ...entry, lastError: error.message });
      return res.status(202).json({
        saved: false,
        queued: true,
        message: "The leaderboard is offline. Your score will be added when it's back.",
      });
    }
    console.error("Leaderboard rejected a score:", error.message);
    return res.status(502).json({ message: "The leaderboard couldn't accept this score." });
  }
};

// GET /songs/:songId/leaderboard — top scores for a song, via the microservice.
const getSongLeaderboard = async (req, res) => {
  const limit = req.query.limit === undefined ? DEFAULT_LIMIT : Number(req.query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return res.status(400).json({ message: "limit must be a whole number from 1 to 50." });
  }

  try {
    const data = await leaderboard.getSongLeaderboard(req.params.songId, limit);
    await flushOutboxQuietly();
    return res.json({ available: true, entries: data.entries });
  } catch (error) {
    if (error instanceof leaderboard.LeaderboardUnavailableError) {
      return res.status(503).json({ available: false, entries: [] });
    }
    return res.status(502).json({ available: false, entries: [] });
  }
};

module.exports = { submitScore, getSongLeaderboard };
