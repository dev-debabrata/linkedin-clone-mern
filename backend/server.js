import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import http from "http";

import authRoutes from "./routes/auth.route.js";
import searchRoutes from "./routes/search.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import connectionRoutes from "./routes/connection.route.js";
import messageRoutes from "./routes/message.route.js";

import { connectDB } from "./lib/db.js";
import { initSocket } from "./lib/socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
initSocket(server);
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	})
);

// 15mb leaves room for 10 MB chat attachments sent as base64
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/messages", messageRoutes);

if (process.env.NODE_ENV === "production") {
	const pathToFrontend = path.join(__dirname, '..', 'frontend', 'dist');

	app.use(express.static(pathToFrontend));

	app.get(/.*/, (req, res) => {
		res.sendFile(path.resolve(pathToFrontend, "index.html"));
	});
}


const startServer = async () => {
	try {
		await connectDB();
		server.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (err) {
		console.error("Failed to connect to MongoDB", err);
		process.exit(1);
	}
};

startServer();
