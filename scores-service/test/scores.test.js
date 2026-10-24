// Integration tests for the scores service.
// They need a throwaway MongoDB: set TEST_SCORES_MONGO_URI, e.g.
//   TEST_SCORES_MONGO_URI=mongodb://localhost:27017/cadenza-scores-test npm test
// Without it the tests are skipped. The database is dropped afterwards.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const MONGO_URI = process.env.TEST_SCORES_MONGO_URI;
const API_KEY = "test-key";
const skip = MONGO_URI ? false : "set TEST_SCORES_MONGO_URI to run";

let server;
let baseUrl;

before(async () => {
  if (skip) return;
  process.env.SCORES_MONGO_URI = MONGO_URI;
  process.env.SCORES_API_KEY = API_KEY;
  const app = require("../app");
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (skip) return;
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  server.close();
});

function post(body, key = API_KEY) {
  return fetch(`${baseUrl}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(key ? { "x-api-key": key } : {}) },
    body: JSON.stringify(body),
  });
}

const run = (overrides) => ({
  submissionId: crypto.randomUUID(),
  userId: "u1",
  username: "alice",
  songId: "mary-had-a-little-lamb",
  score: 1000,
  maxCombo: 10,
  accuracy: 90,
  speed: 1,
  ...overrides,
});

test("health reports ok", { skip }, async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, "ok");
});

test("rejects writes without the API key", { skip }, async () => {
  assert.equal((await post(run(), null)).status, 401);
  assert.equal((await post(run(), "wrong")).status, 401);
});

test("rejects invalid scores", { skip }, async () => {
  const res = await post(run({ score: -5, accuracy: 150 }));
  assert.equal(res.status, 400);
  assert.ok((await res.json()).errors.length >= 2);
});

test("a retried submission is stored once", { skip }, async () => {
  const body = run({ userId: "retry-user", songId: "retry-song" });
  assert.equal((await post(body)).status, 201);
  assert.equal((await post(body)).status, 201);
  const res = await fetch(`${baseUrl}/scores/retry-song/top`);
  assert.equal((await res.json()).scores.length, 1);
});

test("the response reports personal best and rank", { skip }, async () => {
  const first = await (await post(run({ userId: "pb", username: "pat", songId: "pb-song", score: 800 }))).json();
  assert.equal(first.isPersonalBest, true);
  assert.equal(first.rank, 1);
  const worse = await (await post(run({ userId: "pb", username: "pat", songId: "pb-song", score: 300 }))).json();
  assert.equal(worse.isPersonalBest, false);
  assert.equal(worse.personalBest, 800);
});

test("leaderboard keeps each player's best run, highest first", { skip }, async () => {
  await post(run({ userId: "u1", username: "alice", score: 500 }));
  await post(run({ userId: "u1", username: "alice", score: 1500 }));
  await post(run({ userId: "u2", username: "bob", score: 1200 }));
  await post(run({ userId: "u3", username: "cara", score: 900, songId: "other-song" }));

  const res = await fetch(`${baseUrl}/scores/mary-had-a-little-lamb/top?limit=5`);
  assert.equal(res.status, 200);
  const { scores } = await res.json();
  assert.deepEqual(
    scores.map((s) => [s.rank, s.username, s.score]),
    [
      [1, "alice", 1500],
      [2, "bob", 1200],
    ]
  );
});

test("a user's bests are private and grouped by song", { skip }, async () => {
  assert.equal((await fetch(`${baseUrl}/scores/users/u1/best`)).status, 401);
  const res = await fetch(`${baseUrl}/scores/users/u1/best`, { headers: { "x-api-key": API_KEY } });
  const { bests } = await res.json();
  assert.equal(bests.length, 1);
  assert.equal(bests[0].score, 1500);
});
