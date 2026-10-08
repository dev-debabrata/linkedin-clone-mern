import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
	{
		url: { type: String, required: true },
		name: { type: String, required: true },
		type: { type: String, enum: ["image", "file"], required: true },
		size: Number,
	},
	{ _id: false }
);

const messageSchema = new mongoose.Schema(
	{
		sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		text: { type: String, trim: true, maxlength: 2000, default: "" },
		attachment: attachmentSchema,
		read: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
