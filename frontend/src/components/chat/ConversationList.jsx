import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { Loader } from "lucide-react";
import { conversationsQuery, messagePreview } from "../../lib/chat";
import { useChat } from "../../context/ChatContext";
import ChatAvatar from "./ChatAvatar";

// Items link to /messages/:id, or call onSelect(user) when given (used by the popup)
const ConversationList = ({ activeId, onSelect }) => {
	const { onlineUsers, typingUsers } = useChat();
	const { data: conversations = [], isLoading } = useQuery(conversationsQuery);
	const Item = onSelect ? "button" : Link;

	return (
		<>
			<h2 className='p-4 text-xl font-bold border-b border-gray-200'>Messaging</h2>
			{isLoading ? (
				<Loader className='animate-spin text-gray-400 mx-auto my-8' />
			) : conversations.length === 0 ? (
				<p className='p-4 text-sm text-gray-500'>Connect with people to start chatting with them.</p>
			) : (
				<ul className='flex-1 overflow-y-auto divide-y divide-gray-100'>
					{conversations.map(({ user, lastMessage, unreadCount }) => {
						const preview = typingUsers.has(user._id)
							? "typing..."
							: lastMessage
								? `${lastMessage.sender === user._id ? "" : "You: "}${messagePreview(lastMessage)}`
								: user.headline;

						return (
							<li key={user._id}>
								<Item
									{...(onSelect ? { type: "button", onClick: () => onSelect(user) } : { to: `/messages/${user._id}` })}
									className={`flex w-full text-left items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer ${activeId === user._id ? "bg-blue-50" : ""}`}
								>
									<ChatAvatar user={user} online={onlineUsers.has(user._id)} />
									<div className='flex-1 min-w-0'>
										<div className='flex justify-between items-baseline gap-2'>
											<p className='font-semibold truncate'>{user.name}</p>
											{lastMessage && (
												<span className='text-xs text-gray-500 shrink-0'>
													{formatDistanceToNowStrict(new Date(lastMessage.createdAt))}
												</span>
											)}
										</div>
										<div className='flex justify-between items-center gap-2'>
											<p className={`text-sm truncate ${unreadCount ? "font-semibold text-gray-900" : "text-gray-500"}`}>
												{preview}
											</p>
											{unreadCount > 0 && (
												<span className='shrink-0 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5'>
													{unreadCount}
												</span>
											)}
										</div>
									</div>
								</Item>
							</li>
						);
					})}
				</ul>
			)}
		</>
	);
};
export default ConversationList;
