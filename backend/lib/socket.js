import { Server } from "socket.io";
import { getUserFromToken } from "../middleware/auth.middleware.js";

let io;
const onlineUsers = new Map(); // userId -> number of open sockets (one per tab)

const isOnline = (userId) => onlineUsers.has(userId);

// Every socket joins a room named after its user id, so this reaches all of a user's tabs
export const emitToUser = (userId, event, data) => io?.to(userId.toString()).emit(event, data);

const getCookie = (header = "", name) =>
	header.split("; ").find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1);

export const initSocket = (server) => {
	io = new Server(server, { cors: { origin: process.env.CLIENT_URL, credentials: true } });

	// Same cookie auth as the REST API
	io.use(async (socket, next) => {
		const user = await getUserFromToken(getCookie(socket.handshake.headers.cookie, "jwt-linkedin"));
		if (!user) return next(new Error("Unauthorized"));
		socket.user = user;
		next();
	});

	io.on("connection", (socket) => {
		const userId = socket.user._id.toString();
		const friendIds = socket.user.connections.map(String);
		socket.join(userId);

		const openSockets = onlineUsers.get(userId) ?? 0;
		onlineUsers.set(userId, openSockets + 1);
		if (openSockets === 0) friendIds.forEach((id) => emitToUser(id, "userOnline", userId));
		socket.emit("onlineFriends", friendIds.filter(isOnline));

		socket.on("typing", ({ to, isTyping }) => {
			if (friendIds.includes(to)) emitToUser(to, "typing", { from: userId, isTyping });
		});

		socket.on("disconnect", () => {
			const remaining = onlineUsers.get(userId) - 1;
			if (remaining > 0) return onlineUsers.set(userId, remaining);
			onlineUsers.delete(userId);
			friendIds.forEach((id) => emitToUser(id, "userOffline", userId));
		});
	});
};
