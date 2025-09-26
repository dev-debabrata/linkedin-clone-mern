import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";

const COOKIE_OPTIONS = {
	httpOnly: true,
	maxAge: 3 * 24 * 60 * 60 * 1000,
	sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
	secure: process.env.NODE_ENV === "production",
};

export const signup = async (req, res) => {
	try {
		const { name, username, email, password } = req.body;

		if (!name || !username || !email || !password) {
			return res.status(400).json({ message: "All fields are required" });
		}

		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return res.status(400).json({ message: "Email already exists" });
		}

		const existingUsername = await User.findOne({ username });
		if (existingUsername) {
			return res.status(400).json({ message: "Username already exists" });
		}

		if (password.length < 6) {
			return res.status(400).json({ message: "Password must be at least 6 characters" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = new User({
			name,
			email,
			password: hashedPassword,
			username,
		});

		await user.save();

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });

<<<<<<< HEAD
		// Set cookie
		res.cookie("jwt-linkedin", token, COOKIE_OPTIONS);
=======
		res.cookie("jwt-linkedin", token, {
			httpOnly: true, // prevent XSS attack
			maxAge: 3 * 24 * 60 * 60 * 1000,
			sameSite: "none",
			secure: process.env.NODE_ENV === "production", // prevents man-in-the-middle attacks
		});
>>>>>>> 6fc73537af1b4d1ee0a4482c1bf5a7e302a2028f

		res.status(201).json({ message: "User registered successfully" });

		const profileUrl = `${process.env.CLIENT_URL}/profile/${user.username}`;

		try {
			await sendWelcomeEmail(user.email, user.name, profileUrl);
		} catch (emailError) {
			console.error("Error sending welcome Email", emailError);
		}
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
<<<<<<< HEAD

		// Set cookie
		res.cookie("jwt-linkedin", token, COOKIE_OPTIONS);
=======
		await res.cookie("jwt-linkedin", token, {
			httpOnly: true,
			maxAge: 3 * 24 * 60 * 60 * 1000,
			sameSite: "none",
			secure: process.env.NODE_ENV === "production",
		});
>>>>>>> 6fc73537af1b4d1ee0a4482c1bf5a7e302a2028f

		res.json({ message: "Logged in successfully" });
	} catch (error) {
		console.error("Error in login controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const logout = (req, res) => {
	// Clear cookie with same options
	res.clearCookie("jwt-linkedin", COOKIE_OPTIONS);
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
