import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const FriendRequest = ({ request }) => {
	const queryClient = useQueryClient();

	const { mutate: acceptConnectionRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/accept/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request accepted");
			queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
		},
		onError: (error) => {
			toast.error(error.response.data.error);
		},
	});

	const { mutate: rejectConnectionRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/reject/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request rejected");
			queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
		},
		onError: (error) => {
			toast.error(error.response.data.error);
		},
	});

	return (
		<div className='bg-white rounded-lg shadow p-4 flex items-center justify-between transition-all hover:shadow-md'>
			<div className='flex items-center gap-3 md:gap-4 lg:gap-4'>
				<Link to={`/profile/${request.sender.username}`}>
					<img
						src={request.sender.profilePicture || "/avatar.png"}
						alt={request.name}
						className='w-12 h-12 md:w-16 md:h-16 lg:w-16 lg:h-16 rounded-full object-cover'
					/>
				</Link>

				<div>
					<Link to={`/profile/${request.sender.username}`} className='font-semibold text-[16px] md:text-lg lg:text-lg'>
						{request.sender.name}
					</Link>
					<p className='text-gray-600 truncate max-w-[100px] md:max-w-[350px] lg:max-w-[400px]'>{request.sender.headline}</p>
				</div>
			</div>

			<div className='space-x-2'>
				<button
					className='bg-primary text-sm md:text-base lg:text-base text-white px-3 py-1 md:px-4 md:py-2 lg:px-4 lg:py-2 rounded-md hover:bg-primary-dark transition-colors cursor-pointer'
					onClick={() => acceptConnectionRequest(request._id)}
				>
					Accept
				</button>
				<button
					className='bg-gray-200 text-sm md:text-base lg:text-base text-gray-800 px-3 py-1 md:px-4 md:py-2 lg:px-4 lg:py-2 rounded-md hover:bg-gray-300 transition-colors cursor-pointer'
					onClick={() => rejectConnectionRequest(request._id)}
				>
					Reject
				</button>
			</div>
		</div>
	);
};
export default FriendRequest;
