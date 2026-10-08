import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";

// Cloudinary's fl_attachment flag makes the browser download instead of open
const downloadUrl = (url) => url.replace("/upload/", "/upload/fl_attachment/");

// Full-screen image viewer; closes on Esc, the X, or a click outside the image
const ImageModal = ({ image, onClose }) => {
	useEffect(() => {
		const handleKey = (e) => e.key === "Escape" && onClose();
		document.addEventListener("keydown", handleKey);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", handleKey);
			document.body.style.overflow = "";
		};
	}, [onClose]);

	// Portal so the chat popup's overflow/z-index can't clip it
	return createPortal(
		<div className='fixed inset-0 z-[100] bg-black/85 flex flex-col' onClick={onClose}>
			<div className='flex items-center justify-between gap-4 p-4 text-white'>
				<p className='truncate text-sm'>{image.name}</p>
				<div className='flex gap-2 shrink-0' onClick={(e) => e.stopPropagation()}>
					<a
						href={downloadUrl(image.url)}
						className='p-2 rounded-full hover:bg-white/15'
						aria-label='Download image'
						title='Download'
					>
						<Download size={22} />
					</a>
					<button
						type='button'
						onClick={onClose}
						className='p-2 rounded-full hover:bg-white/15 cursor-pointer'
						aria-label='Close'
						title='Close'
					>
						<X size={22} />
					</button>
				</div>
			</div>
			<div className='flex-1 min-h-0 flex items-center justify-center p-4 pt-0'>
				<img
					src={image.url}
					alt={image.name}
					className='max-h-full max-w-full object-contain rounded'
					onClick={(e) => e.stopPropagation()}
				/>
			</div>
		</div>,
		document.body
	);
};
export default ImageModal;
