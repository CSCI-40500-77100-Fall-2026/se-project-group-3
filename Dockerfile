# Cadenza: React/Vite client + Express API in one image.
# The client calls the API at http://localhost:3000 and the API only allows
# CORS from http://localhost:5173, so both run here on those same ports.

# ---- Build the client ----
FROM node:22-slim AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- Runtime ----
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app

# Server: production dependencies only
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/

# Client: built files plus vite, which `vite preview` needs to serve them
COPY --from=client-build /app/client ./client

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000 5173
CMD ["./docker-entrypoint.sh"]
