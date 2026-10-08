import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	getAttachment,
	getConversations,
	getMessages,
	markAsRead,
	requireConnection,
	sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/conversations", getConversations);
router.get("/attachments/:messageId", getAttachment);
router.get("/:userId", requireConnection, getMessages);
router.post("/:userId", requireConnection, sendMessage);
router.put("/:userId/read", requireConnection, markAsRead);

export default router;
