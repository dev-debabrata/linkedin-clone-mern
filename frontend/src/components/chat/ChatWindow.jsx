import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, FileText, Image, Loader, Paperclip, SendHorizontal, X } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import { socket } from "../../lib/socket";
import { MAX_ATTACHMENT_BYTES, appendMessage, formatBytes, messagesQuery, readAsDataURL } from "../../lib/chat";
import { useChat } from "../../context/ChatContext";
import ChatAvatar from "./ChatAvatar";
import MessageAttachment from "./MessageAttachment";

const TYPING_TIMEOUT = 2000;

// onBack shows a back arrow; backClassName controls where it is visible
const ChatWindow = ({ friend, onBack, backClassName = "" }) => {
	const queryClient = useQueryClient();
	const { onlineUsers, typingUsers } = useChat();
	const [text, setText] = useState("");
	// { data (base64 data URL), name, size } chosen but not yet sent
	const [attachment, setAttachment] = useState(null);
	const fileInputRef = useRef(null);
	const bottomRef = useRef(null);
	const typingTimer = useRef(null);

	const { data: messages = [], isLoading } = useQuery(messagesQuery(friend._id));

	const isTyping = typingUsers.has(friend._id);
	const hasUnread = messages.some((m) => m.sender === friend._id && !m.read);
	const lastOwnMessage = messages.findLast((m) => m.sender !== friend._id);

	const { mutate: sendMessage, isPending: isSending } = useMutation({
		mutationFn: async (draft) => (await axiosInstance.post(`/messages/${friend._id}`, draft)).data,
		onSuccess: (message) => {
			queryClient.setQueryData(["messages", friend._id], (prev) => appendMessage(prev, message));
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
		},
		// Restore the draft so nothing is lost
		onError: (err, draft) => {
			setText(draft.text);
			setAttachment(draft.attachment);
			toast.error(err.response?.data?.message || "Message not sent");
		},
	});

	const { mutate: markAsRead } = useMutation({
		mutationFn: () => axiosInstance.put(`/messages/${friend._id}/read`),
		onSuccess: () => {
			queryClient.setQueryData(["messages", friend._id], (prev) =>
				prev?.map((m) => (m.sender === friend._id ? { ...m, read: true } : m))
			);
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
		},
	});

	// Opening the chat, or receiving a message while it's open, marks it read
	useEffect(() => {
		if (hasUnread) markAsRead();
	}, [hasUnread, markAsRead]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length, isTyping]);

	const stopTyping = useCallback(() => {
		if (!typingTimer.current) return;
		clearTimeout(typingTimer.current);
		typingTimer.current = null;
		socket.emit("typing", { to: friend._id, isTyping: false });
	}, [friend._id]);

	// Also clears the indicator when leaving the chat
	useEffect(() => stopTyping, [stopTyping]);

	const handleChange = (e) => {
		setText(e.target.value);
		if (!typingTimer.current) socket.emit("typing", { to: friend._id, isTyping: true });
		clearTimeout(typingTimer.current);
		typingTimer.current = setTimeout(stopTyping, TYPING_TIMEOUT);
	};

	// accept: "image/*" for the photo button, "" (any file) for the paperclip
	const pickFile = (accept) => {
		fileInputRef.current.accept = accept;
		fileInputRef.current.click();
	};

	const handleFileChange = async (e) => {
		const file = e.target.files?.[0];
		e.target.value = ""; // allow picking the same file again
		if (!file) return;
		if (file.size > MAX_ATTACHMENT_BYTES) return toast.error("Files must be 10 MB or smaller");
		setAttachment({ data: await readAsDataURL(file), name: file.name, size: file.size });
	};

	const canSend = (text.trim() || attachment) && !isSending;

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!canSend) return;
		stopTyping();
		sendMessage({ text: text.trim(), attachment });
		setText("");
		setAttachment(null);
	};

	return (
		<div className='flex flex-col h-full'>
			<div className='flex items-center gap-3 p-3 border-b border-gray-200'>
				{onBack && (
					<button
						type='button'
						onClick={onBack}
						className={`text-gray-600 cursor-pointer ${backClassName}`}
						aria-label='Back to conversations'
					>
						<ArrowLeft size={22} />
					</button>
				)}
				<ChatAvatar user={friend} online={onlineUsers.has(friend._id)} size='size-10' />
				<div className='min-w-0'>
					<Link to={`/profile/${friend.username}`} className='font-semibold hover:underline truncate block'>
						{friend.name}
					</Link>
					<p className='text-xs text-gray-500'>
						{isTyping ? "typing..." : onlineUsers.has(friend._id) ? "Online" : "Offline"}
					</p>
				</div>
			</div>

			<div className='flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50'>
				{isLoading ? (
					<Loader className='animate-spin text-gray-400 mx-auto my-8' />
				) : messages.length === 0 ? (
					<p className='text-center text-sm text-gray-500 py-8'>Say hi to {friend.name} 👋</p>
				) : (
					messages.map((message) => {
						const isOwn = message.sender !== friend._id;
						return (
							<div key={message._id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
								<div
									className={`max-w-[75%] p-2 rounded-2xl space-y-1 ${
										isOwn ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-gray-200 rounded-bl-sm"
									}`}
								>
									{message.attachment && <MessageAttachment message={message} isOwn={isOwn} />}
									{message.text && <p className='px-1 whitespace-pre-wrap break-words'>{message.text}</p>}
								</div>
								<span className='text-[11px] text-gray-400 mt-0.5'>
									{format(new Date(message.createdAt), "p")}
									{message === lastOwnMessage && message.read && " · Seen"}
								</span>
							</div>
						);
					})
				)}
				{isTyping && <p className='text-sm text-gray-500 italic'>{friend.name} is typing...</p>}
				<div ref={bottomRef} />
			</div>

			{attachment && (
				<div className='flex items-center gap-2 mx-3 mt-2 p-2 rounded-lg bg-gray-100'>
					{attachment.data.startsWith("data:image/") ? (
						<img src={attachment.data} alt={attachment.name} className='size-12 rounded object-cover' />
					) : (
						<FileText size={32} className='text-gray-500 shrink-0' />
					)}
					<div className='flex-1 min-w-0'>
						<p className='text-sm font-medium truncate'>{attachment.name}</p>
						<p className='text-xs text-gray-500'>{formatBytes(attachment.size)}</p>
					</div>
					<button
						type='button'
						onClick={() => setAttachment(null)}
						className='p-1 text-gray-500 hover:text-gray-700 cursor-pointer'
						aria-label='Remove attachment'
					>
						<X size={18} />
					</button>
				</div>
			)}

			<form onSubmit={handleSubmit} className='flex items-center gap-1 p-3 border-t border-gray-200'>
				<input type='file' ref={fileInputRef} onChange={handleFileChange} className='hidden' />
				{[
					["image/*", <Image size={20} />, "Attach a photo"],
					["", <Paperclip size={20} />, "Attach a file"],
				].map(([accept, icon, label]) => (
					<button
						key={label}
						type='button'
						onClick={() => pickFile(accept)}
						className='p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer'
						aria-label={label}
						title={label}
					>
						{icon}
					</button>
				))}
				<input
					value={text}
					onChange={handleChange}
					placeholder='Write a message...'
					maxLength={2000}
					className='flex-1 min-w-0 px-4 py-2 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
				/>
				<button
					type='submit'
					disabled={!canSend}
					className='p-2 rounded-full text-blue-600 hover:bg-blue-50 disabled:text-gray-300 cursor-pointer disabled:cursor-default'
					aria-label='Send message'
				>
					{isSending ? <Loader size={22} className='animate-spin' /> : <SendHorizontal size={22} />}
				</button>
			</form>
		</div>
	);
};
export default ChatWindow;
