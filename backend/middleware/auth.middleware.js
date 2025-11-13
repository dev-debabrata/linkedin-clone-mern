import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
	try {
		const token = req.cookies["jwt-linkedin"];

		if (!token) {
			req.user = null;
			return next();
		}

		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET);
		} catch (error) {
			req.user = null;
			return next();
		}

		const user = await User.findById(decoded.userId).select("-password");

		req.user = user || null;
		next();

	} catch (error) {
		console.error("protectRoute error", error);
		req.user = null;
		next();
	}
};

// import jwt from "jsonwebtoken";
// import User from "../models/user.model.js";

// export const protectRoute = async (req, res, next) => {
// 	try {
// 		const token = req.cookies["jwt-linkedin"];

// 		if (!token) {
// 			return res.status(401).json({ message: "Unauthorized - No Token Provided" });
// 		}

// 		let decoded;
// 		try {
// 			decoded = jwt.verify(token, process.env.JWT_SECRET);
// 		} catch (err) {
// 			return res.status(401).json({ message: "Unauthorized - Invalid Token" });
// 		}

// 		const user = await User.findById(decoded.userId).select("-password");
// 		if (!user) {
// 			return res.status(401).json({ message: "User not found" });
// 		}

// 		req.user = user;
// 		next();
// 	} catch (error) {
// 		console.error("Error in protectRoute middleware:", error);
// 		res.status(500).json({ message: "Internal server error" });
// 	}
// };
