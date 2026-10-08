import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { conversationsQuery } from "../lib/chat";
import ConversationList from "../components/chat/ConversationList";
import ChatWindow from "../components/chat/ChatWindow";

const MessagesPage = () => {
	const { userId } = useParams();
	const navigate = useNavigate();
	const { data: conversations = [], isLoading } = useQuery(conversationsQuery);
	const friend = conversations.find((c) => c.user._id === userId)?.user;

	return (
		<div className='grid grid-cols-1 md:grid-cols-3 bg-white rounded-lg shadow overflow-hidden h-[calc(100dvh-150px)] md:h-[calc(100vh-120px)]'>
			{/* On mobile only one pane shows: the list, or the open chat */}
			<div className={`${userId ? "hidden md:flex" : "flex"} flex-col border-r border-gray-200 min-h-0`}>
				<ConversationList activeId={userId} />
			</div>

			<div className={`${userId ? "flex" : "hidden md:flex"} flex-col md:col-span-2 min-h-0`}>
				{friend ? (
					<ChatWindow
						key={friend._id}
						friend={friend}
						onBack={() => navigate("/messages")}
						backClassName='md:hidden'
					/>
				) : (
					<div className='flex flex-1 flex-col items-center justify-center gap-2 text-gray-500 p-6 text-center'>
						<MessageSquare size={48} className='text-gray-300' />
						{userId && !isLoading
							? "You can only message your connections."
							: "Select a connection to start chatting."}
					</div>
				)}
			</div>
		</div>
	);
};
export default MessagesPage;
