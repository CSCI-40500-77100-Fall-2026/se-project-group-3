import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../api.js";
import "./Leaderboard.css";

// Top scores for one song, served by the scores microservice through the main
// server. If that service is down, this shows a message and nothing else breaks.
export default function Leaderboard({ songId, limit = 5, refreshKey = 0, highlightUsername, title = "Leaderboard" }) {
  const [state, setState] = useState({ status: "loading", scores: [] });

  useEffect(() => {
    if (!songId) return undefined;
    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));

    axios
      .get(`${API_URL}/scores/${encodeURIComponent(songId)}/top`, { params: { limit }, timeout: 8000 })
      .then((response) => {
        if (!cancelled) setState({ status: "ready", scores: response.data.scores ?? [] });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", scores: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [songId, limit, refreshKey]);

  if (!songId) return null;

  return (
    <section className="leaderboard" aria-label={title}>
      <p className="leaderboard__title">{title}</p>

      {state.status === "error" && <p className="leaderboard__message">Leaderboard unavailable right now.</p>}
      {state.status === "loading" && state.scores.length === 0 && (
        <p className="leaderboard__message">Loading scores...</p>
      )}
      {state.status === "ready" && state.scores.length === 0 && (
        <p className="leaderboard__message">No scores yet. Be the first!</p>
      )}

      {state.scores.length > 0 && (
        <ol className="leaderboard__list">
          {state.scores.map((entry) => (
            <li
              key={`${entry.rank}-${entry.username}`}
              className={`leaderboard__row${
                highlightUsername && entry.username === highlightUsername ? " leaderboard__row--you" : ""
              }`}
            >
              <span className="leaderboard__rank">{entry.rank}</span>
              <span className="leaderboard__name">{entry.username}</span>
              <span className="leaderboard__score">{entry.score.toLocaleString()}</span>
              <span className="leaderboard__accuracy">{entry.accuracy.toFixed(1)}%</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
