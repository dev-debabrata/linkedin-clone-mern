import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "../lib/socket";
import { appendMessage } from "../lib/chat";
import { ChatContext } from "./ChatContext";

const withItem = (set, item, present) => {
	const next = new Set(set);
	present ? next.add(item) : next.delete(item);
	return next;
};

// Owns the socket connection for the logged-in user and keeps chat caches in sync with server events
const ChatProvider = ({ userId, children }) => {
	const queryClient = useQueryClient();
	const [onlineUsers, setOnlineUsers] = useState(new Set());
	const [typingUsers, setTypingUsers] = useState(new Set());

	useEffect(() => {
		if (!userId) return;

		const handlers = {
			onlineFriends: (ids) => setOnlineUsers(new Set(ids)),
			userOnline: (id) => setOnlineUsers((prev) => withItem(prev, id, true)),
			userOffline: (id) => setOnlineUsers((prev) => withItem(prev, id, false)),
			typing: ({ from, isTyping }) => setTypingUsers((prev) => withItem(prev, from, isTyping)),
			newMessage: (message) => {
				const otherId = message.sender === userId ? message.receiver : message.sender;
				setTypingUsers((prev) => withItem(prev, otherId, false));
				queryClient.setQueryData(["messages", otherId], (messages) => appendMessage(messages, message));
				queryClient.invalidateQueries({ queryKey: ["conversations"] });
			},
			messagesRead: ({ by }) =>
				queryClient.setQueryData(["messages", by], (messages) =>
					messages?.map((m) => (m.receiver === by ? { ...m, read: true } : m))
				),
		};

		Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
		socket.connect();

		return () => {
			Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
			socket.disconnect();
			setOnlineUsers(new Set());
			setTypingUsers(new Set());
		};
	}, [userId, queryClient]);

	return <ChatContext.Provider value={{ onlineUsers, typingUsers }}>{children}</ChatContext.Provider>;
};
export default ChatProvider;
