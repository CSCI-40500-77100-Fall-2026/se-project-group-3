const mongoose = require("mongoose");

// Cache the connection promise so serverless invocations (Vercel) reuse one
// connection instead of opening a new one per request.
let connecting = null;

function connect() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    if (!process.env.SCORES_MONGO_URI) {
      return Promise.reject(new Error("SCORES_MONGO_URI is not set"));
    }
    connecting = mongoose
      .connect(process.env.SCORES_MONGO_URI, { serverSelectionTimeoutMS: 5000 })
      .catch((err) => {
        connecting = null; // allow the next request to retry
        throw err;
      });
  }
  return connecting;
}

module.exports = { connect };
