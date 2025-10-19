import PostCreation from "../components/PostCreation";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";

const PostCreateMobile = () => {

    const { data: authUser } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await axiosInstance.get("/auth/me");
            return res.data;
        },
    });

    if (!authUser) return null;

    return (
        <div className="md:hidden bg-secondary rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4">Create New Post</h1>
            <PostCreation user={authUser} />
        </div>
    );
};

export default PostCreateMobile;