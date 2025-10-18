import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import Post from "./Post";
import { Loader } from "lucide-react";
import Sidebar from "./Sidebar";


const PostDetails = () => {
    const { postId } = useParams();


    const { data: authUser } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => axiosInstance.get("/auth/me").then(res => res.data)
    });

    const { data: post, isLoading, isError } = useQuery({
        queryKey: ["post", postId],
        queryFn: async () => {
            try {
                const res = await axiosInstance.get(`/posts/${postId}`);
                return res.data;
            } catch (err) {
                if (err.response && err.response.status === 404) return null;
                throw err;
            }
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader size={48} className="animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return <div className="p-4 text-red-500 text-center">Failed to load post. Please try again later.</div>;
    }

    if (!post) {
        return <div className="p-4 text-info text-center">Post not found.</div>;
    }

    return (
        <div className="container mx-auto flex gap-6">
            {/* Sidebar */}
            <div className="hidden lg:block w-74">
                <Sidebar user={authUser} />
            </div>

            {/* Main Post */}
            <div className="flex-1 max-w-2xl">
                <Post post={post} />
            </div>
        </div>
    );
};

export default PostDetails;
