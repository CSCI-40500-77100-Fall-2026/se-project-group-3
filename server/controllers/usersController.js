const User = require("../models/User");
const bcrypt = require("bcrypt");
const { setAuthCookie, clearAuthCookie, setPendingCookie, clearPendingCookie } = require("../utils/authCookie");
const { validateUsername, validatePassword } = require("../utils/validation");

// http://localhost:3000/users/me
const getCurrentUser = async (req, res) => {
	try{

		const user = await User.findById(req.userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		return res.status(200).json({ 
			user: user 
		});
	}
	catch (err) {
		console.log(err)
		return res.status(500).json({ message: "Internal server error" });
	}
}

// http://localhost:3000/users/signup
const createUser = async (req, res) => {
	try {
		const { username, password } = req.body ?? {};

		const usernameCheck = validateUsername(username);
		if (!usernameCheck.isValid) {
			return res.status(400).json({ message: usernameCheck.error });
		}

		const passwordCheck = validatePassword(password);
		if (!passwordCheck.isValid) {
			return res.status(400).json({ message: passwordCheck.error });
		}

		const existingUser = await User.findOne({ 
			username: username.trim() 
		});
		if (existingUser) {
			return res.status(409).json({ message: "Username already exists." });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = await User.create({
			username: username.trim(),
			password: hashedPassword,
		});

		await newUser.save();
	
		return res.status(201).json({
			message: "User created successfully",
			user: newUser
		});
	} catch (err) {
		console.error("Error creating user:", err);
		return res.status(500).json({ message: "An error occurred while creating your account. Please try again later." });
	}
};

// http://localhost:3000/users/signin
const signInUser = async (req, res) => {
	try {

		const { username, password } = req.body;

		const user = await User.findOne({ username: username });
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// returns true if the input password matches the hashed password stored in the database
		const isPasswordValid = await bcrypt.compare(password, user.password);

		// returns error if password does not match
		if (!isPasswordValid) {
			return res.status(401).json({ message: "Invalid password" });
		}

		// 2FA on: password is correct but don't log in yet.
		// issue a short-lived pending cookie; the client then sends the code to /users/totp/verify-signin
		if (user.totpEnabled) {
			setPendingCookie(res, user._id);
			return res.status(200).json({ totpRequired: true });
		}

		// 2FA off: log in straight away
		setAuthCookie(res, user._id);

		return res.status(200).json({
			message: "Sign in successful",
			user: user
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({ message: "Internal server error" });
	}
};

// http://localhost:3000/users/signout
const signOutUser = (req, res) => {
	try {
		clearAuthCookie(res);
		clearPendingCookie(res);
		return res.status(200).json({ message: "Sign out successful" });
	} catch (err) {
		console.log(err);
		return res.status(500).json({ message: "Internal server error" });
	}
};

module.exports = { getCurrentUser, createUser, signInUser, signOutUser };  