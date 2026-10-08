import { axiosInstance } from "./axios";

export const conversationsQuery = {
	queryKey: ["conversations"],
	queryFn: async () => (await axiosInstance.get("/messages/conversations")).data,
};

export const messagesQuery = (userId) => ({
	queryKey: ["messages", userId],
	queryFn: async () => (await axiosInstance.get(`/messages/${userId}`)).data,
});

// Appends a message to a cached chat, ignoring duplicates (it can arrive via both the API response and the socket)
export const appendMessage = (messages, message) =>
	messages && !messages.some((m) => m._id === message._id) ? [...messages, message] : messages;

export const countUnread = (conversations) => conversations?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

// One-line summary for the conversation list
export const messagePreview = ({ text, attachment }) =>
	text || (attachment?.type === "image" ? "📷 Photo" : `📎 ${attachment?.name}`);

export const formatBytes = (bytes = 0) =>
	bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export const readAsDataURL = (file) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
