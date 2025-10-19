import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import Sidebar from "../components/Sidebar";
import { UserPlus } from "lucide-react";
import FriendRequest from "../components/FriendRequest";
import UserCard from "../components/UserCard";
import RecommendedUser from "../components/RecommendedUser";
import { Link } from "react-router-dom";

const NetworkPage = () => {
	const queryClient = useQueryClient();
	const user = queryClient.getQueryData(["authUser"]);

	const { data: connectionRequests } = useQuery({
		queryKey: ["connectionRequests"],
		queryFn: () => axiosInstance.get("/connections/requests"),
	});

	const { data: connections } = useQuery({
		queryKey: ["connections"],
		queryFn: () => axiosInstance.get("/connections"),
	});

	const { data: recommendedUsers } = useQuery({
		queryKey: ["recommendedUsers"],
		queryFn: () =>
			axiosInstance.get("/users/suggestions?limit=3").then(res => res.data),
	});

	return (
		<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
			<div className='hidden md:block lg:block col-span-1 lg:col-span-1 '>
				<Sidebar user={user} />
			</div>
			<div className='col-span-1 lg:col-span-3'>
				<div className='bg-secondary rounded-lg shadow p-6 mb-6'>
					<h1 className='text-2xl font-bold mb-6'>My Network</h1>

					{connectionRequests?.data?.length > 0 ? (
						<div className='mb-8'>
							<h2 className='text-xl font-semibold mb-2'>Connection Request</h2>
							<div className='space-y-4'>
								{connectionRequests.data
									.filter(request => request)
									.map((request, index) => (
										<FriendRequest key={request._id || index} request={request} />
									))}
							</div>
						</div>
					) : (
						<div className='bg-white rounded-lg shadow p-6 text-center mb-6'>
							<UserPlus size={48} className='mx-auto text-gray-400 mb-4' />
							<h3 className='text-xl font-semibold mb-2'>No Connection Requests</h3>
							<p className='text-gray-600'>
								You don&apos;t have any pending connection requests at the moment.
							</p>
							<p className='text-gray-600 mt-2'>
								Explore suggested connections below to expand your network!
							</p>
						</div>
					)}

					{recommendedUsers?.length > 0 && (
						<div className=" mb-8 lg:hidden">
							<h2 className='text-xl font-semibold mb-2'>Suggestions</h2>
							<div className="bg-secondary rounded-lg shadow p-4">
								<div className=" flex justify-between items-center mb-4">
									<h2 className='font-semibold text-[18px]'>People you may know</h2>
									<Link
										to='/suggestions'
										className=' text-base text-primary hover:underline'
									>
										See All
									</Link>
								</div>
								<div className="space-y-3">
									{recommendedUsers.map((user) => (
										<RecommendedUser key={user._id} user={user} />
									))}
								</div>
							</div>
						</div>
					)}

					{connections?.data?.length > 0 && (
						<div className='mb-6'>
							<h2 className='text-xl font-semibold mb-4'>My Connections</h2>
							<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
								{connections.data
									.filter(connection => connection)
									.map((connection) => (
										<UserCard key={connection._id} user={connection} isConnection={true} />
									))}
							</div>
						</div>
					)}
				</div>
			</div >
		</div >
	);
};
export default NetworkPage;

