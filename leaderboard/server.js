const app = require("./app");

const PORT = process.env.PORT ?? 4000;

app.listen(PORT, () => {
  console.log(`Leaderboard service running on port ${PORT}`);
});
