const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

		// creates jwt authentication token
		const token = jwt.sign(
			{ userId: user._id }, 
			process.env.JWT_SECRET, 
			{ expiresIn: "24h" }
		); 

		res.cookie("token", token, { 
			httpOnly: true, 
			maxAge: 24 * 60 * 60 * 1000 
		});

		res.status(200).json({ 
			message: "Sign in successful", 
			user: user 
		});
	} catch (err) {
		console.log(err);
	}
};

// http://localhost:3000/users/signout
const signOutUser = (req, res) => {
	try {
		res.clearCookie("token", {
			httpOnly: true,
		});
		return res.status(200).json({ message: "Sign out successful" });
	} catch (err) {
		console.log(err);
		return res.status(500).json({ message: "Internal server error" });
	}
};

module.exports = { getCurrentUser, createUser, signInUser, signOutUser };  