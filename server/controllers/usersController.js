const User = require("../models/User");
const bcrypt = require("bcrypt");
const { setAuthCookie, clearAuthCookie, setPendingCookie, clearPendingCookie } = require("../utils/authCookie");

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
	try{

			const { username, password } = req.body;

			const existingUser = await User.findOne({ 
				username: username 
			});
			if (existingUser || !username || !password) {
				return res.status(409).json({ message: "Username already exists or invalid input" });
			}

			const hashedPassword = await bcrypt.hash(password, 10);

		  const newUser = await User.create({
				username: username,
				password: hashedPassword,
			});

			await newUser.save();
		
			res.status(201).json({
				message: "User created successfully",
				user: newUser
			});
	}
	catch (err) {
		console.log(err)
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