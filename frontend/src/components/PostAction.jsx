export default function PostAction({ icon, text, onClick }) {
	return (
		<button
			className="flex items-center cursor-pointer px-2 py-1"
			onClick={onClick}
			type="button"
		>
			<span className="mr-1 flex-shrink-0">{icon}</span>
			<span className="text-sm whitespace-nowrap">{text}</span>
		</button>
	);
}

