const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

const routes = require("./routes");

// Allows Express to read JSON request bodies
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173"
}));

app.get("/", (req, res) => {
  res.send("Express server is running!");
});

app.use("", routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

