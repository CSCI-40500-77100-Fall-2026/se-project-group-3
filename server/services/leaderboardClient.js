// REST client for the leaderboard microservice.
//
// Resilience: every attempt is cut off after TIMEOUT_MS, and failed attempts
// (timeouts, network errors, 5xx) are retried with a growing pause. 4xx
// responses mean the request itself is wrong, so they are never retried.
// Worst case is 3 x 2s + 0.25s + 0.75s = 7s, inside Vercel's 10s function limit.

const TIMEOUT_MS = 2000;
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [250, 750];

class LeaderboardUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = "LeaderboardUnavailableError";
  }
}

class LeaderboardRejectedError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "LeaderboardRejectedError";
    this.status = status;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(method, path, body) {
  const baseUrl = process.env.LEADERBOARD_URL;
  if (!baseUrl) {
    throw new LeaderboardUnavailableError("LEADERBOARD_URL is not configured.");
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.LEADERBOARD_API_KEY ?? "",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const data = await response.json().catch(() => null);

      if (response.ok) return data;
      if (response.status < 500) {
        throw new LeaderboardRejectedError(
          response.status,
          data?.error?.message ?? `Leaderboard rejected the request (${response.status}).`
        );
      }
      lastError = new Error(`Leaderboard responded with ${response.status}.`);
    } catch (error) {
      if (error instanceof LeaderboardRejectedError) throw error;
      lastError = error.name === "TimeoutError" ? new Error(`Timed out after ${TIMEOUT_MS}ms.`) : error;
    }

    if (attempt < MAX_ATTEMPTS) await sleep(BACKOFF_MS[attempt - 1]);
  }

  throw new LeaderboardUnavailableError(
    `Leaderboard unavailable after ${MAX_ATTEMPTS} attempts: ${lastError?.message ?? "unknown error"}`
  );
}

module.exports = {
  LeaderboardUnavailableError,
  LeaderboardRejectedError,
  submitScore: (score) => request("POST", "/scores", score),
  getSongLeaderboard: (songId, limit) =>
    request("GET", `/songs/${encodeURIComponent(songId)}/leaderboard?limit=${limit}`),
};
