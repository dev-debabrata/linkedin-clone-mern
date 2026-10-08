import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Resolves a JWT to its user (without password); null if invalid, expired, or issued before the last password change
export const getUserFromToken = async (token) => {
	try {
		const { userId, iat } = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(userId).select("-password +passwordChangedAt");
		if (!user || (user.passwordChangedAt && iat * 1000 < user.passwordChangedAt.getTime())) return null;
		return user;
	} catch {
		return null;
	}
};

export const protectRoute = async (req, res, next) => {
	const token = req.cookies["jwt-linkedin"];
	if (!token) {
		return res.status(401).json({ message: "Unauthorized - No Token Provided" });
	}

	const user = await getUserFromToken(token);
	if (!user) {
		return res.status(401).json({ message: "Unauthorized - Invalid Token" });
	}

	req.user = user;
	next();
};


// import jwt from "jsonwebtoken";
// import User from "../models/user.model.js";

// export const protectRoute = async (req, res, next) => {
// 	try {
// 		const token = req.cookies["jwt-linkedin"];

// 		if (!token) {
// 			req.user = null;
// 			return next();
// 		}

// 		let decoded;
// 		try {
// 			decoded = jwt.verify(token, process.env.JWT_SECRET);
// 		} catch (error) {
// 			req.user = null;
// 			return next();
// 		}

// 		const user = await User.findById(decoded.userId).select("-password");

// 		req.user = user || null;
// 		next();

// 	} catch (error) {
// 		console.error("protectRoute error", error);
// 		req.user = null;
// 		next();
// 	}
// };