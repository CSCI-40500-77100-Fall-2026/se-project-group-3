const User = require("../models/User");
const Song = require("../models/Song");
const scoresClient = require("../services/scoresClient");

const UNAVAILABLE = { message: "Leaderboard is temporarily unavailable" };

// Turns a scores-service failure into a 503 instead of a crash, so the rest
// of the app (songs, login, playing) keeps working without the leaderboard.
async function withScoresService(res, call) {
  try {
    const { status, data } = await call();
    return res.status(status).json(data);
  } catch (err) {
    if (err instanceof scoresClient.ScoresUnavailableError) {
      console.error(err.message);
      return res.status(503).json(UNAVAILABLE);
    }
    throw err;
  }
}

// POST /scores (logged in): forward a finished game to the scores service.
const submitScore = async (req, res) => {
  const { songId, score, maxCombo, accuracy, speed } = req.body ?? {};

  if (typeof songId !== "string" || !songId) {
    return res.status(400).json({ message: "songId is required" });
  }

  // The main app owns users and songs, so it checks both before anything is
  // sent to the scores service, which cannot see this database.
  const [user, songExists] = await Promise.all([
    User.findById(req.userId).select("username"),
    Song.exists({ songId }),
  ]);
  if (!user) return res.status(401).json({ message: "User not found" });
  if (!songExists) return res.status(404).json({ message: "Song not found" });

  return withScoresService(res, () =>
    scoresClient.submitScore({
      userId: String(user._id),
      username: user.username,
      songId,
      score,
      maxCombo,
      accuracy,
      speed,
    })
  );
};

// GET /scores/:songId/top (public): the song's leaderboard.
const getTopScores = (req, res) =>
  withScoresService(res, () => scoresClient.getTopScores(req.params.songId, req.query.limit));

// GET /scores/me (logged in): the user's best score on each song.
const getMyBests = (req, res) => withScoresService(res, () => scoresClient.getUserBests(req.userId));

module.exports = { submitScore, getTopScores, getMyBests };
