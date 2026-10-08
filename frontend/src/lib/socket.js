import { io } from "socket.io-client";

// Connected by ChatProvider once the user is logged in; the auth cookie is sent with the handshake
export const socket = io(import.meta.env.VITE_BACKEND_URL, { withCredentials: true, autoConnect: false });
