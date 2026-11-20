import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../api.js";

const TOP_N = 5;

export default function SongLeaderboard({ songId }) {
  const [state, setState] = useState({ status: "loading", entries: [] });

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API_URL}/songs/${encodeURIComponent(songId)}/leaderboard`, {
        params: { limit: TOP_N },
        timeout: 15000,
      })
      .then((response) => {
        if (!cancelled) setState({ status: "ready", entries: response.data.entries });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unavailable", entries: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [songId]);

  return (
    <section className="song-leaderboard" aria-label="Top scores">
      <h2 className="song-leaderboard__title">Top scores</h2>

      {state.status === "loading" && <p className="song-leaderboard__note">Loading…</p>}
      {state.status === "unavailable" && (
        <p className="song-leaderboard__note">Leaderboard unavailable right now.</p>
      )}
      {state.status === "ready" && state.entries.length === 0 && (
        <p className="song-leaderboard__note">No scores yet. Be the first.</p>
      )}

      {state.entries.length > 0 && (
        <ol className="song-leaderboard__list">
          {state.entries.map((entry) => (
            <li key={entry.userId} className="song-leaderboard__row">
              <span className="song-leaderboard__rank">{entry.rank}</span>
              <span className="song-leaderboard__name">{entry.username}</span>
              <span className="song-leaderboard__accuracy">{entry.accuracy.toFixed(2)}%</span>
              <span className="song-leaderboard__score">{entry.score.toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
