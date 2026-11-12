const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {

	const token = req.cookies.token;

	if (!token) {
		return res.status(401).json({ message: "Authentication required" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// pending 2FA tokens carry a purpose claim; they must never count as a full login,
		// even if someone copies one into the token cookie by hand
		if (decoded.purpose) {
			return res.status(401).json({ message: "Invalid token" });
		}

		req.userId = decoded.userId;
		next();
	} catch (err) {
		return res.status(401).json({ message: "Invalid token" });
	}
};

module.exports = authenticate;