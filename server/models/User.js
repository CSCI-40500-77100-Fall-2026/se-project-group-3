const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  totpSecret: String, // the secret shared by server and mobile authenticator. Key to generate code 
  totpEnabled: { type: Boolean, default: false },
  lastUsed: Number, // to prevent reusing code from the same 30 second window.
});

// Never send the password hash to the browser, however the user was loaded
// (findOne, findById, or User.create at signup).
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.totpSecret;
    delete ret.lastUsed;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
