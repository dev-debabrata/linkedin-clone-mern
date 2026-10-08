import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, X } from "lucide-react";
import { conversationsQuery, countUnread } from "../../lib/chat";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";

// Bottom-right message button with a popup chat; desktop only, hidden on the Messaging page
const FloatingChat = () => {
	const { pathname } = useLocation();
	const [isOpen, setIsOpen] = useState(false);
	const [friend, setFriend] = useState(null);
	const { data: conversations } = useQuery(conversationsQuery);

	if (pathname.startsWith("/messages")) return null;

	const unreadCount = countUnread(conversations);

	return (
		<div className='hidden md:block fixed bottom-5 right-5 z-40'>
			{isOpen && (
				<div className='absolute bottom-16 right-0 w-80 h-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden'>
					{friend ? (
						<ChatWindow key={friend._id} friend={friend} onBack={() => setFriend(null)} />
					) : (
						<ConversationList onSelect={setFriend} />
					)}
				</div>
			)}

			<button
				type='button'
				onClick={() => setIsOpen((prev) => !prev)}
				className='relative size-14 rounded-full bg-primary text-white shadow-lg hover:bg-blue-700 flex items-center justify-center cursor-pointer'
				aria-label={isOpen ? "Close messaging" : "Open messaging"}
			>
				{isOpen ? <X size={24} /> : <MessageSquare size={24} />}
				{!isOpen && unreadCount > 0 && (
					<span className='absolute -top-1 -right-1 bg-red-700 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center'>
						{unreadCount}
					</span>
				)}
			</button>
		</div>
	);
};
export default FloatingChat;
