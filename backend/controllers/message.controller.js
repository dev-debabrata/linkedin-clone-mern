import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { emitToUser } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js";
import { Readable } from "stream";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

// Route guard for /:userId: chatting is limited to connections
export const requireConnection = (req, res, next) => {
	if (!req.user.connections.some((id) => id.toString() === req.params.userId)) {
		return res.status(403).json({ message: "You can only message your connections" });
	}
	next();
};

// Every connection, with the latest message and unread count; most recent chats first
export const getConversations = async (req, res) => {
	try {
		const me = req.user._id;

		const summaries = await Message.aggregate([
			{ $match: { $or: [{ sender: me }, { receiver: me }] } },
			{ $sort: { createdAt: -1 } },
			{
				$group: {
					_id: { $cond: [{ $eq: ["$sender", me] }, "$receiver", "$sender"] },
					lastMessage: { $first: "$$ROOT" },
					unreadCount: {
						$sum: { $cond: [{ $and: [{ $eq: ["$receiver", me] }, { $eq: ["$read", false] }] }, 1, 0] },
					},
				},
			},
		]);
		const summaryByUser = new Map(summaries.map((s) => [s._id.toString(), s]));

		const friends = await User.find({ _id: { $in: req.user.connections } })
			.select("name username profilePicture headline")
			.lean();

		const conversations = friends
			.map((user) => {
				const summary = summaryByUser.get(user._id.toString());
				return { user, lastMessage: summary?.lastMessage ?? null, unreadCount: summary?.unreadCount ?? 0 };
			})
			.sort((a, b) => (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0));

		res.json(conversations);
	} catch (error) {
		console.error("Error in getConversations controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { userId } = req.params;

		const me = req.user._id;
		const messages = await Message.find({
			$or: [
				{ sender: me, receiver: userId },
				{ sender: userId, receiver: me },
			],
		})
			.sort({ createdAt: -1 })
			.limit(100);

		res.json(messages.reverse());
	} catch (error) {
		console.error("Error in getMessages controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Images are stored as images (inline previews); everything else as raw files that keep their extension
const uploadAttachment = async ({ data, name }) => {
	const isImage = data.startsWith("data:image/");
	const safeName = String(name).slice(0, 200);
	const result = await cloudinary.uploader.upload(data, {
		folder: "chat",
		resource_type: isImage ? "image" : "raw",
		...(!isImage && { public_id: `${Date.now()}-${safeName.replace(/[^\w.-]/g, "_")}` }),
	});
	return { url: result.secure_url, name: safeName, type: isImage ? "image" : "file", size: result.bytes };
};

const validateMessage = (text, attachment) => {
	if (!text && !attachment) return "Message cannot be empty";
	if (text.length > 2000) return "Message is too long";
	if (!attachment) return null;
	if (typeof attachment.data !== "string" || !attachment.data.startsWith("data:") || !attachment.name) {
		return "Invalid attachment";
	}
	// base64 is ~4/3 the size of the original file
	if (attachment.data.length * 0.75 > MAX_ATTACHMENT_BYTES) return "Files must be 10 MB or smaller";
	return null;
};

export const sendMessage = async (req, res) => {
	try {
		const { userId } = req.params;
		const text = req.body.text?.trim() ?? "";
		const { attachment } = req.body;

		const error = validateMessage(text, attachment);
		if (error) return res.status(400).json({ message: error });

		const message = await Message.create({
			sender: req.user._id,
			receiver: userId,
			text,
			attachment: attachment && (await uploadAttachment(attachment)),
		});

		// Sender too, so their other open tabs stay in sync
		emitToUser(userId, "newMessage", message);
		emitToUser(req.user._id, "newMessage", message);

		res.status(201).json(message);
	} catch (error) {
		console.error("Error in sendMessage controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const markAsRead = async (req, res) => {
	try {
		const { userId } = req.params;

		await Message.updateMany({ sender: userId, receiver: req.user._id, read: false }, { read: true });

		// Lets the sender show "Seen"
		emitToUser(userId, "messagesRead", { by: req.user._id.toString() });

		res.json({ message: "Messages marked as read" });
	} catch (error) {
		console.error("Error in markAsRead controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};


// Streams a chat file to one of the two participants. Fetched through Cloudinary's signed API download,
// so it works even when the account blocks public delivery of PDF/ZIP files.
export const getAttachment = async (req, res) => {
	try {
		const message = await Message.findById(req.params.messageId);
		const isParticipant = message && [message.sender, message.receiver].some((id) => id.equals(req.user._id));
		if (!isParticipant || message.attachment?.type !== "file") {
			return res.status(404).json({ message: "Attachment not found" });
		}

		const { url, name } = message.attachment;
		const publicId = decodeURIComponent(url.split(/\/upload\/(?:v\d+\/)?/)[1]);
		const file = await fetch(
			cloudinary.utils.private_download_url(publicId, "", {
				resource_type: "raw",
				type: "upload",
				expires_at: Math.floor(Date.now() / 1000) + 60,
			})
		);
		if (!file.ok) return res.status(502).json({ message: "Could not load the file" });

		// Only PDFs open in the browser; anything else (e.g. an uploaded .html) is forced to download
		const contentType = file.headers.get("content-type") || "application/octet-stream";
		const inline = contentType === "application/pdf" && !req.query.download;
		res.set({
			"Content-Type": contentType,
			"Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(name)}`,
			"X-Content-Type-Options": "nosniff",
			"Cache-Control": "private, max-age=3600",
		});
		Readable.fromWeb(file.body).pipe(res);
	} catch (error) {
		console.error("Error in getAttachment controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};
