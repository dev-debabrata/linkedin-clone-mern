import { useState } from "react";
import { FileText } from "lucide-react";
import { formatBytes } from "../../lib/chat";
import { axiosInstance } from "../../lib/axios";
import ImageModal from "./ImageModal";

// Inline image (opens the viewer), or a file card; isOwn picks colours for the sender's blue bubble
const MessageAttachment = ({ message: { _id, attachment }, isOwn }) => {
	const [isViewerOpen, setIsViewerOpen] = useState(false);

	if (attachment.type === "image") {
		return (
			<>
				<button type='button' onClick={() => setIsViewerOpen(true)} className='block cursor-zoom-in'>
					<img src={attachment.url} alt={attachment.name} className='max-h-60 rounded-lg object-cover' />
				</button>
				{isViewerOpen && <ImageModal image={attachment} onClose={() => setIsViewerOpen(false)} />}
			</>
		);
	}

	// Files are served by the backend (login-protected) rather than Cloudinary's public URL
	return (
		<a
			href={`${axiosInstance.defaults.baseURL}/messages/attachments/${_id}`}
			target='_blank'
			rel='noreferrer'
			className={`flex items-center gap-2 p-2 rounded-lg ${isOwn ? "bg-blue-700 hover:bg-blue-800" : "bg-gray-100 hover:bg-gray-200"}`}
		>
			<FileText size={28} className='shrink-0' />
			<div className='min-w-0'>
				<p className='text-sm font-medium truncate'>{attachment.name}</p>
				<p className={`text-xs ${isOwn ? "text-blue-100" : "text-gray-500"}`}>{formatBytes(attachment.size)}</p>
			</div>
		</a>
	);
};
export default MessageAttachment;
