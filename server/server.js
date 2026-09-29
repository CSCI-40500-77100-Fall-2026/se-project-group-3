const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = 3000;

const routes = require("./routes");

// Allows Express to read JSON request bodies
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173"
}));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

app.get("/", (req, res) => {
  res.send("Express server is running!");
});

app.use("", routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

