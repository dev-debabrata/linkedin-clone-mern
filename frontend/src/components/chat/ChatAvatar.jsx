const ChatAvatar = ({ user, online, size = "size-12" }) => (
	<div className='relative shrink-0'>
		<img
			src={user.profilePicture || "/avatar.png"}
			alt={user.name}
			className={`${size} rounded-full object-cover border border-gray-200`}
		/>
		{online && (
			<span className='absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-white' />
		)}
	</div>
);
export default ChatAvatar;
