
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { ExternalLink, Eye, MessageSquare, ThumbsUp, Trash2, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { formatDistanceToNow } from "date-fns";

const NotificationsPage = () => {
	// const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	const queryClient = useQueryClient();
	const authUser = queryClient.getQueryData(["authUser"]);



	const { data: notifications, isLoading } = useQuery({
		queryKey: ["notifications"],
		queryFn: () => axiosInstance.get("/notifications"),
	});

	const { mutate: markAsReadMutation } = useMutation({
		mutationFn: (id) => axiosInstance.put(`/notifications/${id}/read`),
		onSuccess: () => {
			queryClient.invalidateQueries(["notifications"]);
		},
	});

	const { mutate: deleteNotificationMutation } = useMutation({
		mutationFn: (id) => axiosInstance.delete(`/notifications/${id}`),
		onSuccess: () => {
			queryClient.invalidateQueries(["notifications"]);
			toast.success("Notification deleted");
		},
	});

	const renderNotificationIcon = (type) => {
		switch (type) {
			case "like":
				return <ThumbsUp className='text-blue-500 size-3 md:size-5 lg:size-5' />;
			case "comment":
				return <MessageSquare className='text-green-500 size-3 md:size-5 lg:size-5' />;
			case "connectionAccepted":
				return <UserPlus className='text-purple-500 size-3 md:size-5 lg:size-5' />;
			default:
				return null;
		}
	};

	const renderNotificationContent = (notification) => {

		if (!notification || !notification.relatedUser) {
			return null;
		}

		switch (notification.type) {
			case "like":
				return (
					<span>
						<strong>{notification.relatedUser.name}</strong> liked your post
					</span>
				);
			case "comment":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						commented on your post
					</span>
				);
			case "connectionAccepted":
				return (
					<span>
						<Link to={`/profile/${notification.relatedUser.username}`} className='font-bold'>
							{notification.relatedUser.name}
						</Link>{" "}
						accepted your connection request
					</span>
				);
			default:
				return null;
		}
	};

	const renderRelatedPost = (relatedPost) => {
		if (!relatedPost) return null;

		return (
			<Link
				to={`/post/${relatedPost._id}`}
				className='mt-2 p-2 bg-gray-50 rounded-md flex items-center space-x-2 hover:bg-gray-100 transition-colors'
			>
				{relatedPost.image && (
					<img
						src={relatedPost.image}
						alt='Post preview'
						className='w-6 h-6 object-cover rounded' />
				)}
				<div className='flex-1 overflow-hidden'>
					<p className='text-xs md:text-sm lg:text-sm text-gray-600 truncate max-w-[100px] md:max-w-[250px] lg:max-w-[300px]'>{relatedPost.content}</p>
				</div>
				<ExternalLink size={14} className='text-gray-400' />
			</Link>
		);
	};

	return (
		<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
			<div className='col-span-1 lg:col-span-1 hidden lg:block sticky top-[78px] h-[calc(100vh-110px)] overflow-y-auto'>
				<Sidebar user={authUser} />
			</div>
			<div className='col-span-1 lg:col-span-3'>
				<div className='bg-white rounded-lg shadow p-6'>
					<h1 className='text-2xl font-bold mb-6'>Notifications</h1>

					{isLoading ? (
						<p>Loading notifications...</p>
					) : notifications && notifications.data.length > 0 ? (
						<ul>
							{notifications.data.map((notification) => (
								// Add a check to ensure both the notification and its relatedUser exist
								notification?.relatedUser && (
									<li
										key={notification._id}
										className={`bg-white border rounded-lg p-4 my-4 transition-all hover:shadow-md ${!notification.read ? "border-blue-500" : "border-gray-200"
											}`}
									>
										<div className='flex items-start justify-between'>
											<div className='flex items-center space-x-3 md:space-x-4 lg:space-x-4'>
												<Link to={`/profile/${notification.relatedUser.username}`}>
													<img
														src={notification.relatedUser.profilePicture || "/avatar.png"}
														alt={notification.relatedUser.name}
														className='w-10 h-10 md:w-12 md:h-12 lg:w-12 lg:h-12 rounded-full object-cover'
													/>
												</Link>

												<div>
													<div className='flex items-center gap-2'>
														<div className='p-1 bg-gray-100 rounded-full'>
															{renderNotificationIcon(notification.type)}
														</div>
														<p className='text-xs md:text-sm lg:text-sm truncate max-w-[140px] md:max-w-none lg:max-w-none'>{renderNotificationContent(notification)}</p>
													</div>
													<p className='text-xs text-gray-500 mt-1'>
														{formatDistanceToNow(new Date(notification.createdAt), {
															addSuffix: true,
														})}
													</p>
													{renderRelatedPost(notification.relatedPost)}
												</div>
											</div>

											<div className='flex gap-2'>
												{!notification.read && (
													<button
														onClick={() => markAsReadMutation(notification._id)}
														className='p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors cursor-pointer'
														aria-label='Mark as read'
													>
														<Eye size={16} />
													</button>
												)}

												<button
													onClick={() => deleteNotificationMutation(notification._id)}
													className='p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors cursor-pointer'
													aria-label='Delete notification'
												>
													<Trash2 size={16} />
												</button>
											</div>
										</div>
									</li>
								)
							))}
						</ul>
					) : (
						<p>No notification at the moment.</p>
					)}
				</div>
			</div>
		</div>
	);
};
export default NotificationsPage;
