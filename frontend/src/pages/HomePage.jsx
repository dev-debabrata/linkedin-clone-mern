import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import Sidebar from "../components/Sidebar";
import PostCreation from "../components/PostCreation";
import Post from "../components/Post";
import { Users, Loader } from "lucide-react";
import RecommendedUser from "../components/RecommendedUser";
import { Link } from "react-router-dom";

const HomePage = () => {

	// AuthUser
	const queryClient = useQueryClient();
	const authUser = queryClient.getQueryData(["authUser"]);

	// RecomendedUser
	const { data: recommendedUsers,
		isLoading: recommendedLoading,
	} = useQuery({
		queryKey: ["recommendedUsers"],
		queryFn: () =>
			axiosInstance.get("/users/suggestions?limit=4").then(res => res.data),
	});

	// Post
	const { data: posts,
		isLoading: postsLoading,
	} = useQuery({
		queryKey: ["posts"],
		queryFn: async () => {
			const res = await axiosInstance.get("/posts");
			return res.data;
		},
	});


	// Loading
	if (postsLoading || recommendedLoading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<Loader size={48} className="animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className='grid grid-cols-1 lg:grid-cols-4 md:grid-cols-4 lg:gap-6 md:gap-2'>
			<div className='hidden lg:block lg:col-span-1 md:block md:col-span-1 sticky top-[78px] h-[calc(100vh-110px)] overflow-y-auto'>
				<Sidebar user={authUser} />
			</div>

			<div className='md:col-span-2 lg:col-span-2 order-first lg:order-none md:order-none'>
				<div className=" hidden md:block lg:block">
					<PostCreation user={authUser} />
				</div>

				{posts?.map((post) => (
					<Post key={post._id} post={post} />
				))}

				{posts?.length === 0 && (
					<div className='bg-white rounded-lg shadow p-8 text-center'>
						<div className='mb-6'>
							<Users size={64} className='mx-auto text-blue-500' />
						</div>
						<h2 className='text-2xl font-bold mb-4 text-gray-800'>No Posts Yet</h2>
						<p className='text-gray-600 mb-6'>Connect with others to start seeing posts in your feed!</p>
					</div>
				)}
			</div>

			{recommendedUsers?.length > 0 && (
				<div className='col-span lg:col-span-1 md:block md:col-span-1 hidden lg:block sticky top-[78px] h-[calc(100vh-110px)] overflow-y-auto'>
					<div className='bg-secondary rounded-lg shadow p-4'>
						<div className='flex items-center justify-between mb-4'>
							<h2 className='font-semibold md:text-sm lg:text-base'>People you may know</h2>
							<Link
								to='/suggestions'
								className=' text-xs lg:text-sm text-primary hover:underline'
							>
								See All
							</Link>
						</div>
						{recommendedUsers?.map((user) => (
							<RecommendedUser key={user._id} user={user} />
						))}
					</div>
				</div>
			)}
		</div>
	);
};
export default HomePage;
