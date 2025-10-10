import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";


export const getSuggestedConnections = async (req, res) => {
	try {
		const currentUser = await User.findById(req.user._id).select("connections");

		const limit = parseInt(req.query.limit, 10) || 0;

		const query = User.find({
			_id: {
				$ne: req.user._id,
				$nin: currentUser.connections,
			},
		}).select("name username profilePicture headline");

		if (limit > 0) {
			query.limit(limit);
		}

		const suggestedUsers = await query;

		res.json(suggestedUsers);
	} catch (error) {
		console.error("Error in getSuggestedConnections controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getPublicProfile = async (req, res) => {
	try {
		const user = await User.findOne({ username: req.params.username }).select("-password");

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.json(user);
	} catch (error) {
		console.error("Error in getPublicProfile controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const allowedFields = [
			"name",
			"username",
			"headline",
			"about",
			"location",
			"profilePicture",
			"bannerImg",
			"skills",
			"experience",
			"education",
		];

		const updatedData = {};

		for (const field of allowedFields) {
			if (req.body[field]) {
				updatedData[field] = req.body[field];
			}
		}

		if (req.body.profilePicture) {
			const result = await cloudinary.uploader.upload(req.body.profilePicture);
			updatedData.profilePicture = result.secure_url;
		}

		if (req.body.bannerImg) {
			const result = await cloudinary.uploader.upload(req.body.bannerImg);
			updatedData.bannerImg = result.secure_url;
		}

		const user = await User.findByIdAndUpdate(req.user._id, { $set: updatedData }, { new: true }).select(
			"-password"
		);

		res.json(user);
	} catch (error) {
		console.error("Error in updateProfile controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};


export const searchUsers = async (req, res) => {
	try {
		const { query } = req.query;

		if (!query) {
			return res.status(400).json({ message: "Search query is required." });
		}

		const users = await User.find({
			$or: [
				{ name: { $regex: query, $options: 'i' } },
				{ username: { $regex: query, $options: 'i' } }
			]
		})
			.select('name username profileImg')
			.limit(10);

		res.status(200).json(users);
	} catch (error) {
		console.error("Error searching for users:", error);
		res.status(500).json({ message: "Internal server error." });
	}
};