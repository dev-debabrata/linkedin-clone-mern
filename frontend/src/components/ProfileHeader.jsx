import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";
import { Camera, Clock, MapPin, UserCheck, UserPlus, X, Trash2 } from "lucide-react";

const ProfileHeader = ({ userData, onSave, isOwnProfile }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editedData, setEditedData] = useState({});
	const queryClient = useQueryClient();

	const authUser = queryClient.getQueryData(["authUser"]);

	// Connection Status Query
	const { data: connectionStatus, refetch: refetchConnectionStatus } = useQuery({
		queryKey: ["connectionStatus", userData._id],
		queryFn: () => axiosInstance.get(`/connections/status/${userData._id}`),
		enabled: !isOwnProfile,
	});

	const isConnected = userData.connections.some((connection) => connection === authUser?._id);

	// Connection Mutations
	const { mutate: sendConnectionRequest } = useMutation({
		mutationFn: (userId) => axiosInstance.post(`/connections/request/${userId}`),
		onSuccess: () => {
			toast.success("Connection request sent");
			refetchConnectionStatus();
			queryClient.invalidateQueries(["connectionRequests"]);
		},
		onError: (error) => toast.error(error.response?.data?.message || "An error occurred"),
	});

	const { mutate: acceptRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/accept/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request accepted");
			refetchConnectionStatus();
			queryClient.invalidateQueries(["connectionRequests"]);
		},
		onError: (error) => toast.error(error.response?.data?.message || "An error occurred"),
	});

	const { mutate: rejectRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/reject/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request rejected");
			refetchConnectionStatus();
			queryClient.invalidateQueries(["connectionRequests"]);
		},
		onError: (error) => toast.error(error.response?.data?.message || "An error occurred"),
	});

	const { mutate: removeConnection } = useMutation({
		mutationFn: (userId) => axiosInstance.delete(`/connections/${userId}`),
		onSuccess: () => {
			toast.success("Connection removed");
			refetchConnectionStatus();
			queryClient.invalidateQueries(["connectionRequests"]);
		},
		onError: (error) => toast.error(error.response?.data?.message || "An error occurred"),
	});

	// Delete profile picture mutation
	const { mutate: deleteProfilePicture, isLoading: deletingProfile } = useMutation({
		mutationFn: async () => {
			const res = await axiosInstance.delete("/users/profile-picture");
			return res.data;
		},
		onSuccess: () => {
			toast.success("Profile picture removed");
			setEditedData((prev) => ({ ...prev, profilePicture: null }));
			queryClient.invalidateQueries(["authUser"]);
			queryClient.invalidateQueries(["user", userData._id]);
		},
		onError: (error) => toast.error(error.response?.data?.message || "Failed to delete profile picture"),
	});

	// Delete banner image mutation
	const { mutate: deleteBannerImage, isLoading: deletingBanner } = useMutation({
		mutationFn: async () => {
			const res = await axiosInstance.delete("/users/banner-image");
			return res.data;
		},
		onSuccess: () => {
			toast.success("Banner image removed");
			setEditedData((prev) => ({ ...prev, bannerImg: null }));
			queryClient.invalidateQueries(["authUser"]);
			queryClient.invalidateQueries(["user", userData._id]);
		},
		onError: (error) => toast.error(error.response?.data?.message || "Failed to delete banner image"),
	});

	// Connection status helper
	const getConnectionStatus = useMemo(() => {

		if (connectionStatus?.data?.status) {
			return connectionStatus.data.status;
		}
		if (isConnected) return "connected";

		return "not_connected";
	}, [isConnected, connectionStatus]);

	const renderConnectionButton = () => {
		const baseClass = "text-white py-2 px-4 rounded-full transition duration-300 flex items-center justify-center";
		switch (getConnectionStatus) {
			case "connected":
				return (
					<div className='flex gap-2 justify-center'>
						<div className={`${baseClass} bg-green-500 hover:bg-green-600`}>
							<UserCheck size={20} className='mr-2' />
							Connected
						</div>
						<button
							className={`${baseClass} bg-red-500 hover:bg-red-600 text-sm cursor-pointer`}
							onClick={() => removeConnection(userData._id)}
						>
							<X size={20} className='mr-2' />
							Remove Connection
						</button>
					</div>
				);
			case "pending":
				return <button
					className={`${baseClass} bg-yellow-500 hover:bg-yellow-600`}>
					<Clock size={20} className='mr-2' />
					Pending
				</button>;
			case "received":
				return (
					<div className='flex gap-2 justify-center'>
						<button
							onClick={() => acceptRequest(connectionStatus.data.requestId)}
							className={`${baseClass} bg-green-500 hover:bg-green-600 cursor-pointer`}>
							Accept
						</button>
						<button
							onClick={() => rejectRequest(connectionStatus.data.requestId)}
							className={`${baseClass} bg-red-500 hover:bg-red-600 cursor-pointer`}>
							Reject
						</button>
					</div>
				);
			default:
				return <button onClick={() => sendConnectionRequest(userData._id)} className='bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-full transition duration-300 flex items-center justify-center cursor-pointer'><UserPlus size={20} className='mr-2' />Connect</button>;
		}
	};

	// Handle image uploads
	const handleImageChange = (event) => {
		const file = event.target.files?.[0] ?? null;

		if (!file) {
			return;
		}

		const reader = new FileReader();

		reader.onloadend = () => {
			setEditedData((prev) => ({
				...prev,
				[event.target.name]: reader.result,
			}));
		};

		reader.onerror = () => {
			toast.error("Failed to load image");
		};

		reader.readAsDataURL(file);
	};

	const handleSave = () => {
		onSave(editedData);
		setIsEditing(false);
	};

	return (
		<div className='bg-white shadow rounded-lg mb-6'>
			{/* Banner */}
			<div
				className='relative h-48 rounded-t-lg bg-cover bg-center'
				style={{ backgroundImage: `url('${editedData.bannerImg || userData.bannerImg || "/banner.png"}')` }}
			>
				{isEditing && (
					<div className='absolute top-2 right-2 flex gap-2'>
						{/* Upload Banner */}
						<label className='bg-white p-2 rounded-full shadow cursor-pointer'>
							<Camera size={20} />
							<input type='file' className='hidden' name='bannerImg' onChange={handleImageChange} accept='image/*' />
						</label>

						{/* Delete Banner */}
						{(userData.bannerImg || editedData.bannerImg) && (
							<button onClick={() => deleteBannerImage()} disabled={deletingBanner} className='bg-white p-2 rounded-full shadow cursor-pointer hover:bg-red-100 transition'>
								<Trash2 size={20} className='text-red-600' />
							</button>
						)}
					</div>
				)}
			</div>

			{/* Profile Picture */}
			<div className='p-4'>
				<div className='relative -mt-20 mb-4 flex justify-center'>
					<img className='w-32 h-32 rounded-full object-cover' src={editedData.profilePicture || userData.profilePicture || "/avatar.png"} alt={userData.name} />
					{isEditing && (
						<>
							{/* Upload */}
							<label className='absolute bottom-0 right-[calc(50%-4rem)] bg-white p-2 rounded-full shadow cursor-pointer'>
								<Camera size={20} />
								<input type='file' className='hidden' name='profilePicture' onChange={handleImageChange} accept='image/*' />
							</label>
							{/* Delete */}
							{(userData.profilePicture || editedData.profilePicture) && (
								<button onClick={() => deleteProfilePicture()} disabled={deletingProfile} className='absolute bottom-0 left-[calc(50%-4rem)] bg-white p-2 rounded-full shadow cursor-pointer hover:bg-red-100 transition'>
									<Trash2 size={20} className='text-red-600' />
								</button>
							)}
						</>
					)}
				</div>

				{/* Editable Fields */}
				<div className='text-center mb-4'>
					{isEditing ? (
						<input type='text' value={editedData.name ?? userData.name} onChange={(e) => setEditedData({ ...editedData, name: e.target.value })} className='text-2xl font-bold mb-2 text-center w-full' />
					) : (
						<h1 className='text-2xl font-bold mb-2'>{userData.name}</h1>
					)}

					{isEditing ? (
						<input type='text' value={editedData.headline ?? userData.headline} onChange={(e) => setEditedData({ ...editedData, headline: e.target.value })} className='text-gray-600 text-center w-full' />
					) : (
						<p className='text-gray-600'>{userData.headline}</p>
					)}

					<div className='flex justify-center items-center mt-2'>
						<MapPin size={16} className='text-gray-500 mr-1' />
						{isEditing ? (
							<input type='text' value={editedData.location ?? userData.location} onChange={(e) => setEditedData({ ...editedData, location: e.target.value })} className='text-gray-600 text-center' />
						) : (
							<span className='text-gray-600'>{userData.location}</span>
						)}
					</div>
				</div>

				{/* Action Buttons */}
				{isOwnProfile ? (
					isEditing ? (
						<button onClick={handleSave} className='w-full bg-primary text-white py-2 px-4 rounded-full hover:bg-primary-dark transition duration-300 cursor-pointer'>Save Profile</button>
					) : (
						<button onClick={() => setIsEditing(true)} className='w-full bg-primary text-white py-2 px-4 rounded-full hover:bg-primary-dark transition duration-300 cursor-pointer'>Edit Profile</button>
					)
				) : (
					<div className='flex justify-center'>{renderConnectionButton()}</div>
				)}
			</div>
		</div>
	);
};

export default ProfileHeader;




// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { useMemo, useState } from "react";
// import { axiosInstance } from "../lib/axios";
// import { toast } from "react-hot-toast";

// import { Camera, Clock, MapPin, UserCheck, UserPlus, X } from "lucide-react";

// const ProfileHeader = ({ userData, onSave, isOwnProfile }) => {
// 	const [isEditing, setIsEditing] = useState(false);
// 	const [editedData, setEditedData] = useState({});
// 	const queryClient = useQueryClient();

// 	const authUser = queryClient.getQueryData(["authUser"]);
// 	// const { data: authUser } = useQuery({ queryKey: ["authUser"] });

// 	const { data: connectionStatus, refetch: refetchConnectionStatus } = useQuery({
// 		queryKey: ["connectionStatus", userData._id],
// 		queryFn: () => axiosInstance.get(`/connections/status/${userData._id}`),
// 		enabled: !isOwnProfile,
// 	});

// 	const isConnected = userData.connections.some((connection) => connection === authUser._id);

// 	const { mutate: sendConnectionRequest } = useMutation({
// 		mutationFn: (userId) => axiosInstance.post(`/connections/request/${userId}`),
// 		onSuccess: () => {
// 			toast.success("Connection request sent");
// 			refetchConnectionStatus();
// 			queryClient.invalidateQueries(["connectionRequests"]);
// 		},
// 		onError: (error) => {
// 			toast.error(error.response?.data?.message || "An error occurred");
// 		},
// 	});

// 	const { mutate: acceptRequest } = useMutation({
// 		mutationFn: (requestId) => axiosInstance.put(`/connections/accept/${requestId}`),
// 		onSuccess: () => {
// 			toast.success("Connection request accepted");
// 			refetchConnectionStatus();
// 			queryClient.invalidateQueries(["connectionRequests"]);
// 		},
// 		onError: (error) => {
// 			toast.error(error.response?.data?.message || "An error occurred");
// 		},
// 	});

// 	const { mutate: rejectRequest } = useMutation({
// 		mutationFn: (requestId) => axiosInstance.put(`/connections/reject/${requestId}`),
// 		onSuccess: () => {
// 			toast.success("Connection request rejected");
// 			refetchConnectionStatus();
// 			queryClient.invalidateQueries(["connectionRequests"]);
// 		},
// 		onError: (error) => {
// 			toast.error(error.response?.data?.message || "An error occurred");
// 		},
// 	});

// 	const { mutate: removeConnection } = useMutation({
// 		mutationFn: (userId) => axiosInstance.delete(`/connections/${userId}`),
// 		onSuccess: () => {
// 			toast.success("Connection removed");
// 			refetchConnectionStatus();
// 			queryClient.invalidateQueries(["connectionRequests"]);
// 		},
// 		onError: (error) => {
// 			toast.error(error.response?.data?.message || "An error occurred");
// 		},
// 	});

// 	const getConnectionStatus = useMemo(() => {
// 		if (isConnected) return "connected";
// 		if (!isConnected) return "not_connected";
// 		return connectionStatus?.data?.status;
// 	}, [isConnected, connectionStatus]);

// 	const renderConnectionButton = () => {
// 		const baseClass = "text-white py-2 px-4 rounded-full transition duration-300 flex items-center justify-center";
// 		switch (getConnectionStatus) {
// 			case "connected":
// 				return (
// 					<div className='flex gap-2 justify-center'>
// 						<div className={`${baseClass} bg-green-500 hover:bg-green-600`}>
// 							<UserCheck size={20} className='mr-2' />
// 							Connected
// 						</div>
// 						<button
// 							className={`${baseClass} bg-red-500 hover:bg-red-600 text-sm cursor-pointer`}
// 							onClick={() => removeConnection(userData._id)}
// 						>
// 							<X size={20} className='mr-2' />
// 							Remove Connection
// 						</button>
// 					</div>
// 				);

// 			case "pending":
// 				return (
// 					<button className={`${baseClass} bg-yellow-500 hover:bg-yellow-600`}>
// 						<Clock size={20} className='mr-2' />
// 						Pending
// 					</button>
// 				);

// 			case "received":
// 				return (
// 					<div className='flex gap-2 justify-center'>
// 						<button
// 							onClick={() => acceptRequest(connectionStatus.data.requestId)}
// 							className={`${baseClass} bg-green-500 hover:bg-green-600`}
// 						>
// 							Accept
// 						</button>
// 						<button
// 							onClick={() => rejectRequest(connectionStatus.data.requestId)}
// 							className={`${baseClass} bg-red-500 hover:bg-red-600`}
// 						>
// 							Reject
// 						</button>
// 					</div>
// 				);
// 			default:
// 				return (
// 					<button
// 						onClick={() => sendConnectionRequest(userData._id)}
// 						className='bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-full transition duration-300 flex items-center justify-center cursor-pointer'
// 					>
// 						<UserPlus size={20} className='mr-2' />
// 						Connect
// 					</button>
// 				);
// 		}
// 	};

// 	const handleImageChange = (event) => {
// 		const file = event.target.files[0];
// 		if (file) {
// 			const reader = new FileReader();
// 			reader.onloadend = () => {
// 				setEditedData((prev) => ({ ...prev, [event.target.name]: reader.result }));
// 			};
// 			reader.readAsDataURL(file);
// 		}
// 	};

// 	const handleSave = () => {
// 		onSave(editedData);
// 		setIsEditing(false);
// 	};

// 	return (
// 		<div className='bg-white shadow rounded-lg mb-6'>
// 			<div
// 				className='relative h-48 rounded-t-lg bg-cover bg-center'
// 				style={{
// 					backgroundImage: `url('${editedData.bannerImg || userData.bannerImg || "/banner.png"}')`,
// 				}}
// 			>
// 				{isEditing && (
// 					<label className='absolute top-2 right-2 bg-white p-2 rounded-full shadow cursor-pointer'>
// 						<Camera size={20} />
// 						<input
// 							type='file'
// 							className='hidden'
// 							name='bannerImg'
// 							onChange={handleImageChange}
// 							accept='image/*'
// 						/>
// 					</label>
// 				)}
// 			</div>

// 			<div className='p-4'>
// 				<div className='relative -mt-20 mb-4'>
// 					<img
// 						className='w-32 h-32 rounded-full mx-auto object-cover'
// 						src={editedData.profilePicture || userData.profilePicture || "/avatar.png"}
// 						alt={userData.name}
// 					/>

// 					{isEditing && (
// 						<label className='absolute bottom-0 right-1/2 transform translate-x-16 bg-white p-2 rounded-full shadow cursor-pointer'>
// 							<Camera size={20} />
// 							<input
// 								type='file'
// 								className='hidden'
// 								name='profilePicture'
// 								onChange={handleImageChange}
// 								accept='image/*'
// 							/>
// 						</label>
// 					)}
// 				</div>

// 				<div className='text-center mb-4'>
// 					{isEditing ? (
// 						<input
// 							type='text'
// 							value={editedData.name ?? userData.name}
// 							onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
// 							className='text-2xl font-bold mb-2 text-center w-full'
// 						/>
// 					) : (
// 						<h1 className='text-2xl font-bold mb-2'>{userData.name}</h1>
// 					)}

// 					{isEditing ? (
// 						<input
// 							type='text'
// 							value={editedData.headline ?? userData.headline}
// 							onChange={(e) => setEditedData({ ...editedData, headline: e.target.value })}
// 							className='text-gray-600 text-center w-full'
// 						/>
// 					) : (
// 						<p className='text-gray-600'>{userData.headline}</p>
// 					)}

// 					<div className='flex justify-center items-center mt-2'>
// 						<MapPin size={16} className='text-gray-500 mr-1' />
// 						{isEditing ? (
// 							<input
// 								type='text'
// 								value={editedData.location ?? userData.location}
// 								onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
// 								className='text-gray-600 text-center'
// 							/>
// 						) : (
// 							<span className='text-gray-600'>{userData.location}</span>
// 						)}
// 					</div>
// 				</div>

// 				{isOwnProfile ? (
// 					isEditing ? (
// 						<button
// 							className='w-full bg-primary text-white py-2 px-4 rounded-full hover:bg-primary-dark
// 							 transition duration-300 cursor-pointer'
// 							onClick={handleSave}
// 						>
// 							Save Profile
// 						</button>
// 					) : (
// 						<button
// 							onClick={() => setIsEditing(true)}
// 							className='w-full bg-primary text-white py-2 px-4 rounded-full hover:bg-primary-dark
// 							 transition duration-300 cursor-pointer'
// 						>
// 							Edit Profile
// 						</button>
// 					)
// 				) : (
// 					<div className='flex justify-center'>{renderConnectionButton()}</div>
// 				)}
// 			</div>
// 		</div>
// 	);
// };
// export default ProfileHeader;
