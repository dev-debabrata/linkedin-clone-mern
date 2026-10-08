import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../emails/emailHandlers.js";
import validator from "validator";
import crypto from "crypto";
import { getUserFromToken } from "../middleware/auth.middleware.js";



const COOKIE_OPTIONS = {
	httpOnly: true,
	maxAge: 3 * 24 * 60 * 60 * 1000,
	sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
	secure: process.env.NODE_ENV === "production",
};


const setAuthCookie = (res, userId) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "3d" });
	res.cookie("jwt-linkedin", token, COOKIE_OPTIONS);
};

const MIN_PASSWORD_LENGTH = 6;

// field tells the frontend which input to show the error under
const badRequest = (res, message, field) => res.status(400).json({ message, field });

// Hashes and stores a new password, invalidating existing sessions and any pending reset link
const updatePassword = async (user, password) => {
	user.password = await bcrypt.hash(password, 10);
	// Backdated 1s because JWT "iat" has second precision; a token issued right after must stay valid
	user.passwordChangedAt = new Date(Date.now() - 1000);
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;
	await user.save();
};


export const signup = async (req, res) => {
	try {
		let { name, username, email, password } = req.body;

		// Basic validation
		if (!name || !username || !email || !password) {
			return badRequest(res, "All fields are required");
		}

		email = email.toLowerCase().trim();
		username = username.toLowerCase().trim();

		if (password.length < MIN_PASSWORD_LENGTH) {
			return badRequest(res, "Password must be at least 6 characters", "password");
		}

		if (!validator.isEmail(email)) {
			return badRequest(res, "Invalid email address", "email");
		}

		// Gmail-only restriction
		if (!email.endsWith("@gmail.com")) {
			return badRequest(res, "Only Gmail addresses are allowed", "email");
		}

		// Check duplicates
		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			return badRequest(res, "An account with this email already exists", "email");
		}

		const existingUsername = await User.findOne({ username });
		if (existingUsername) {
			return badRequest(res, "Username is already taken", "username");
		}

		// Password hashing
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create user
		const user = new User({
			name,
			email,
			username,
			password: hashedPassword,
		});

		await user.save();

		// JWT
		setAuthCookie(res, user._id);

		// Response
		res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			username: user.username,
		});

		// Welcome email (non-blocking)
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
		const { identifier, password } = req.body;
		if (!identifier || !password) {
			return badRequest(res, "All fields are required");
		}

		// Users can log in with either their username or their email
		const value = identifier.toLowerCase().trim();
		const user = await User.findOne(validator.isEmail(value) ? { email: value } : { username: value });
		if (!user || !(await bcrypt.compare(password, user.password))) {
			return badRequest(res, "Incorrect email/username or password");
		}

		setAuthCookie(res, user._id);

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


// Public route: answers null (not 401) when logged out, so the frontend's auth check isn't a failed request
export const getCurrentUser = async (req, res) => {
	try {
		const token = req.cookies["jwt-linkedin"];
		res.json(token ? await getUserFromToken(token) : null);
	} catch (error) {
		console.error("Error in getCurrentUser controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};


const RESET_TOKEN_TTL = 15 * 60 * 1000;
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const forgotPassword = async (req, res) => {
	try {
		const email = req.body.email?.toLowerCase().trim();
		if (!email || !validator.isEmail(email)) {
			return badRequest(res, "Please enter a valid email address", "email");
		}

		// Same response whether or not the account exists, so emails can't be enumerated
		const user = await User.findOne({ email });
		if (user) {
			// Email the raw token, store only its hash
			const resetToken = crypto.randomBytes(32).toString("hex");
			user.resetPasswordToken = hashToken(resetToken);
			user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL);
			await user.save();

			await sendPasswordResetEmail(
				user.email,
				user.name,
				`${process.env.CLIENT_URL}/reset-password/${resetToken}`
			);
		}

		res.json({ message: "If an account exists for this email, a reset link has been sent" });
	} catch (error) {
		console.error("Error in forgotPassword controller:", error);
		res.status(500).json({ message: "Could not send reset email, try again later" });
	}
};


export const resetPassword = async (req, res) => {
	try {
		const { password } = req.body;
		if (!password || password.length < MIN_PASSWORD_LENGTH) {
			return badRequest(res, "Password must be at least 6 characters", "password");
		}

		const user = await User.findOne({
			resetPasswordToken: hashToken(req.params.token),
			resetPasswordExpires: { $gt: new Date() },
		});
		if (!user) {
			return badRequest(res, "This reset link is invalid or has expired. Please request a new one.");
		}

		await updatePassword(user, password);

		res.json({ message: "Password reset successfully" });
	} catch (error) {
		console.error("Error in resetPassword controller:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};


export const changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;
		if (!currentPassword || !newPassword) {
			return badRequest(res, "All fields are required");
		}
		if (newPassword.length < MIN_PASSWORD_LENGTH) {
			return badRequest(res, "New password must be at least 6 characters", "newPassword");
		}

		const user = await User.findById(req.user._id);
		if (!(await bcrypt.compare(currentPassword, user.password))) {
			return badRequest(res, "Current password is incorrect", "currentPassword");
		}
		if (await bcrypt.compare(newPassword, user.password)) {
			return badRequest(res, "New password must be different from the current one", "newPassword");
		}

		await updatePassword(user, newPassword);

		// Other sessions are now invalid; keep this one signed in with a fresh token
		setAuthCookie(res, user._id);
		res.json({ message: "Password changed successfully" });
	} catch (error) {
		console.error("Error in changePassword controller:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
