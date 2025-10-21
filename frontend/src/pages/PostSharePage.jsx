import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import Sidebar from "../components/Sidebar";
import Post from "../components/Post";
import { Loader } from "lucide-react";


const PostSharePage = () => {
	const { postId } = useParams();

	const { data: authUser } = useQuery({
		queryKey: ["authUser"],
		queryFn: async () => {
			const res = await axiosInstance.get("/auth/me");
			return res.data;
		},
	});

	const { data: post, isLoading, isError } = useQuery({
		queryKey: ["post", postId],
		queryFn: async () => {
			try {
				const res = await axiosInstance.get(`/posts/${postId}`);
				return res.data;
			} catch (err) {
				if (err.response?.status === 404) return null;
				throw err;
			}
		},
	});

	if (isLoading)
		return (
			<div className="flex justify-center items-center h-screen">
				<Loader size={48} className="animate-spin text-primary" />
			</div>
		);

	if (isError)
		return (
			<div className="p-4 text-red-500 text-center">
				Failed to load post. Please try again later.
			</div>
		);

	if (!post)
		return (
			<div className="p-4 text-info text-center">Post not found</div>
		);

	return (
		<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
			<div className='hidden lg:block lg:col-span-1'>
				<Sidebar user={authUser} />
			</div>

			<div className='col-span-1 lg:col-span-3 max-w-2xl'>
				<Post post={post} />
			</div>
		</div>
	);
};

export default PostSharePage;
