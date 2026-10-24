// Client for the scores microservice. Every call has a timeout and is retried
// on network errors and 5xx responses, so a slow or briefly unavailable
// scores service never hangs or crashes the main server.
const crypto = require("crypto");

const TIMEOUT_MS = 2000;
const RETRIES = 2; // up to 3 attempts in total
const BACKOFF_MS = 250;

class ScoresUnavailableError extends Error {}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callScores(path, { method = "GET", body } = {}) {
  const baseUrl = process.env.SCORES_SERVICE_URL;
  if (!baseUrl) throw new ScoresUnavailableError("SCORES_SERVICE_URL is not set");

  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await sleep(BACKOFF_MS * attempt);
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.SCORES_API_KEY ?? "",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.status >= 500) {
        lastError = new Error(`scores service responded ${res.status}`);
        continue; // server-side problem: worth retrying
      }
      // 2xx and 4xx are final answers; retrying a 4xx would fail the same way.
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    } catch (err) {
      lastError = err; // timeout or connection failure: retry
    }
  }
  throw new ScoresUnavailableError(`scores service unavailable: ${lastError?.message}`);
}

function submitScore(run) {
  // One id per game, reused on every retry, so the service stores the game once.
  return callScores("/scores", {
    method: "POST",
    body: { submissionId: crypto.randomUUID(), ...run },
  });
}

function getTopScores(songId, limit) {
  const query = limit ? `?limit=${encodeURIComponent(limit)}` : "";
  return callScores(`/scores/${encodeURIComponent(songId)}/top${query}`);
}

function getUserBests(userId) {
  return callScores(`/scores/users/${encodeURIComponent(userId)}/best`);
}

module.exports = { submitScore, getTopScores, getUserBests, ScoresUnavailableError };
