#!/bin/bash
# Start the API and the client together; if either exits, stop the container.

if [ -z "$MONGO_URI" ] || [ -z "$JWT_SECRET" ]; then
  echo "Error: MONGO_URI and JWT_SECRET must be set (docker run -e ...)." >&2
  exit 1
fi

# Forward Ctrl+C / docker stop to both processes
trap 'kill $(jobs -p) 2>/dev/null; exit 0' TERM INT

(cd /app/server && exec node server.js) &
(cd /app/client && exec npx vite preview --host 0.0.0.0 --port 5173 --strictPort) &

wait -n
kill $(jobs -p) 2>/dev/null
exit 1
