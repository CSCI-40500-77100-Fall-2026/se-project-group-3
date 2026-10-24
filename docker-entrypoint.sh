#!/bin/bash
# Start the API, the client and (if configured) the scores microservice;
# if any of them exits, stop the container.

if [ -z "$MONGO_URI" ] || [ -z "$JWT_SECRET" ]; then
  echo "Error: MONGO_URI and JWT_SECRET must be set (docker run -e ...)." >&2
  exit 1
fi

# Forward Ctrl+C / docker stop to every process
trap 'kill $(jobs -p) 2>/dev/null; exit 0' TERM INT

if [ -n "$SCORES_MONGO_URI" ]; then
  # Both processes run in this container, so a random per-run key is enough
  # unless one was passed in.
  export SCORES_API_KEY="${SCORES_API_KEY:-$(node -e 'console.log(require("crypto").randomBytes(24).toString("hex"))')}"
  export SCORES_SERVICE_URL="${SCORES_SERVICE_URL:-http://localhost:4000}"
  (cd /app/scores-service && PORT=4000 exec node server.js) &
else
  echo "SCORES_MONGO_URI not set: running without the leaderboard." >&2
fi

(cd /app/server && exec node server.js) &
(cd /app/client && exec npx vite preview --host 0.0.0.0 --port 5173 --strictPort) &

wait -n
kill $(jobs -p) 2>/dev/null
exit 1
