
const User = require("../models/User");
const getUser = async (req, res) => {
	try{
		console.log("testing get user")
		res.json({ message: "testing get user" });
	}
	catch (err) {
		console.log(err)
	}
}

const createUser = async (req, res) => {
	try{
		  const user = await User.create({
				username: req.body.username,
				password: req.body.password,
			});
			console.log("user created: ", user)
			res.status(201).json(user);
	}
	catch (err) {
		console.log(err)
	}
}

module.exports = { getUser, createUser };  