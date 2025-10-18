import { Link } from "react-router-dom";

function UserCard({ user, isConnection }) {
	return (
		<div className='bg-white rounded-lg shadow p-4 flex flex-col items-center transition-all hover:shadow-md'>
			<Link to={`/profile/${user.username}`} className='flex flex-col items-center'>
				<img
					src={user.profilePicture || "/avatar.png"}
					alt={user.name}
					className='w-12 h-12 md:w-24 md:h-24 lg:w-24 lg:h-24 rounded-full object-cover mb-2 md:mb-4 lg:mb-4'
				/>
				<h3 className='font-semibold text-base md:text-lg lg:text-lg text-center'>{user.name}</h3>
			</Link>
			<p className='text-gray-600 text-center truncate max-w-[140px] md:max-w-[160px] lg:max-w-[160px]'>{user.headline}</p>
			<p className='text-sm text-gray-500 md:mt-2 lg:mt-2'>{user.connections?.length} connections</p>
			<button className='mt-3 md:mt-4 lg:mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors w-full'>
				{isConnection ? "Connected" : "Connect"}
			</button>
		</div>
	);
}

export default UserCard;
