import { createContext, useContext } from "react";

export const ChatContext = createContext({ onlineUsers: new Set(), typingUsers: new Set() });

export const useChat = () => useContext(ChatContext);
