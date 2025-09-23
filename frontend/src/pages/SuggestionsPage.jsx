import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import RecommendedUser from "../components/RecommendedUser";
import Sidebar from "../components/Sidebar";

const SuggestionsPage = () => {

    const { data: authUser, isLoading: loadingUser } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await axiosInstance.get("/auth/me");
            return res.data;
        },
    });

    const {
        data: recommendedUsers,
        isLoading: loadingSuggestions,
        error,
    } = useQuery({
        queryKey: ["recommendedUsers"],
        queryFn: () => axiosInstance.get("/users/suggestions").then((res) => res.data),
    });

    if (loadingUser || loadingSuggestions) return <p className="p-4">Loading...</p>;
    if (error) return <p className="p-4 text-red-500">Failed to load suggestions.</p>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="hidden lg:block lg:col-span-1 sticky top-21 h-[calc(100vh-110px)] overflow-y-auto">
                <Sidebar user={authUser} />
            </div>

            <div className="col-span-1 lg:col-span-3">
                <div className="max-w-3xl p-4 bg-secondary rounded-lg shadow">
                    <h1 className="text-2xl font-bold mb-4">People You May Know</h1>
                    {recommendedUsers?.length === 0 ? (
                        <p>No suggestions available.</p>
                    ) : (
                        recommendedUsers.map((user) =>
                            <RecommendedUser key={user._id} user={user} />)
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuggestionsPage;
