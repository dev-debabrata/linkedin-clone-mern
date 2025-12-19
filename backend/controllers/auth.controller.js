import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import validator from "validator";

const COOKIE_OPTIONS = {
	httpOnly: true,
	maxAge: 3 * 24 * 60 * 60 * 1000,
	sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
	secure: process.env.NODE_ENV === "production",
};


export const signup = async (req, res) => {
	try {
		const { name, username, email, password } = req.body;

		if (!name || !username || !email || !password) {
			return res.status(400).json({ message: "All fields are required" });
		}

		if (!validator.isEmail(email)) {
			return res.status(400).json({ message: "Invalid email address" });
		}

		const domain = email.split("@")[1];
		if (domain !== "gmail.com") {
			return res.status(400).json({
				message: "Invalid email address"
			});
		}

		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return res.status(400).json({ message: "Email already exists" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = new User({
			name,
			email,
			username,
			password: hashedPassword,
		});

		await user.save();

		const token = jwt.sign(
			{ userId: user._id },
			process.env.JWT_SECRET,
			{ expiresIn: "3d" }
		);

		res.cookie("jwt-linkedin", token, COOKIE_OPTIONS);

		res.status(201).json({ message: "User registered successfully" });

		const profileUrl = `${process.env.CLIENT_URL}/profile/${user.username}`;
		sendWelcomeEmail(user.email, user.name, profileUrl)
			.catch(err => console.error("Email failed:", err.message));

	} catch (error) {
		console.error("Error in signup:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};



export const login = async (req, res) => {
	try {
		const { username, password } = req.body;

		const user = await User.findOne({ username });
		if (!user) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });

		res.cookie("jwt-linkedin", token, COOKIE_OPTIONS);

		res.json({ message: "Logged in successfully" });
	} catch (error) {
		console.error("Error in login controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const logout = (req, res) => {
	res.clearCookie("jwt-linkedin", {
		httpOnly: true,
		sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
		secure: process.env.NODE_ENV === "production",
	});
	res.json({ message: "Logged out successfully" });
};

export const getCurrentUser = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		console.error("Error in getCurrentUser controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};



// reference


// export const signup = async (req, res) => {
// 	try {
// 		const { name, username, email, password } = req.body;

// 		if (!name || !username || !email || !password) {
// 			return res.status(400).json({ message: "All fields are required" });
// 		}

// 		const existingEmail = await User.findOne({ email });
// 		if (existingEmail) {
// 			return res.status(400).json({ message: "Email already exists" });
// 		}

// 		const existingUsername = await User.findOne({ username });
// 		if (existingUsername) {
// 			return res.status(400).json({ message: "Username already exists" });
// 		}

// 		if (password.length < 6) {
// 			return res.status(400).json({ message: "Password must be at least 6 characters" });
// 		}

// 		const hashedPassword = await bcrypt.hash(password, 10);

// 		const user = new User({
// 			name,
// 			email,
// 			password: hashedPassword,
// 			username,
// 		});

// 		await user.save();

// 		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });

// 		// Set cookie
// 		res.cookie("jwt-linkedin", token, COOKIE_OPTIONS);

// 		res.status(201).json({ message: "User registered successfully" });

// 		const profileUrl = `${process.env.CLIENT_URL}/profile/${user.username}`;
// 		// const profileUrl = `${process.env.CLIENT_URL || "https://linkedin-clone-dev.vercel.app"}/profile/${user.username}`;


// 		try {
// 			await sendWelcomeEmail(user.email, user.name, profileUrl);
// 		} catch (emailError) {
// 			console.error("Error sending welcome Email", emailError);
// 		}
// 	} catch (error) {
// 		console.error("Error in signup:", error);
// 		res.status(500).json({ message: "Internal server error" });
// 	}
// };