import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { Link } from "react-router-dom";
import { Bell, Home, LogOut, Search, User, Users } from "lucide-react";

const Navbar = () => {

	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);

	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const queryClient = useQueryClient();

	const { data: notifications } = useQuery({
		queryKey: ["notifications"],
		queryFn: async () => axiosInstance.get("/notifications"),
		enabled: !!authUser,
	});

	const { data: connectionRequests } = useQuery({
		queryKey: ["connectionRequests"],
		queryFn: async () => axiosInstance.get("/connections/requests"),
		enabled: !!authUser,
	});

	const { mutate: logout } = useMutation({
		mutationFn: () => axiosInstance.post("/auth/logout"),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
	});

	// Use TanStack Query for the search results as well
	const { data: searchData, isFetching } = useQuery({
		queryKey: ["searchUsers", searchQuery],
		queryFn: async () => {
			if (!searchQuery.trim()) {
				return [];
			}
			const res = await axiosInstance.get(`/search?query=${searchQuery}`);
			return res.data;
		},
		enabled: !!searchQuery.trim(),
		staleTime: 500,
		cacheTime: 500
	});

	useEffect(() => {
		if (searchData) {
			setSearchResults(searchData);
		} else {
			setSearchResults([]);
		}
	}, [searchData]);

	const unreadNotificationCount = notifications?.data.filter((notif) => !notif.read).length;
	const unreadConnectionRequestsCount = connectionRequests?.data?.length;

	return (
		<nav className='bg-secondary shadow-md sticky top-0 z-10'>
			<div className='max-w-7xl mx-auto px-4'>
				<div className='flex justify-between items-center py-3'>
					<div className='flex items-center space-x-4'>
						<Link to='/'>
							<img className='h-8 rounded' src='/small-logo.png' alt='LinkedIn' />
						</Link>
						{/* Search bar */}
						<div className="relative flex items-center h-8 border py-1 px-4 rounded-full bg-white">
							<Search size={16} />
							<input
								type="text"
								placeholder="Search"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="ml-2 text-[16px] outline-none flex-1"
							/>

							{/* Search dropdown */}
							{searchQuery.trim() && (
								<div className="absolute top-full left-0 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-y-auto z-20">
									{isFetching && (
										<div className="px-4 py-2 text-gray-500">Searching...</div>
									)}
									{!isFetching && searchResults.length === 0 && (
										<div className="px-4 py-2 text-gray-500">No results found</div>
									)}
									{searchResults.map((user) => (
										<Link
											key={user._id}
											to={`/profile/${user.username}`}
											className="block px-4 py-2 hover:bg-gray-100"
											onClick={() => setSearchQuery("")}
										>
											{user.name}
										</Link>
									))}
								</div>
							)}
						</div>
						{/* <div className="relative flex justify-center items-center h-8 border py-1 px-4 rounded-full">
							<Search size={16} />
							<input
								className="text-[16px] px-2 text-black border-0 outline-none"
								type="text"
								placeholder="Search"
							/>
						</div> */}
					</div>

					<div className='flex items-center gap-2 md:gap-6'>
						{authUser ? (
							<>
								<Link to={"/"} className='text-neutral flex flex-col items-center'>
									<Home size={20} />
									<span className='text-xs hidden md:block'>Home</span>
								</Link>
								<Link to='/network' className='text-neutral flex flex-col items-center relative'>
									<Users size={20} />
									<span className='text-xs hidden md:block'>My Network</span>
									{unreadConnectionRequestsCount > 0 && (
										<span
											className='absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs 
										rounded-full size-3 md:size-4 flex items-center justify-center'
										>
											{unreadConnectionRequestsCount}
										</span>
									)}
								</Link>
								<Link to='/notifications' className='text-neutral flex flex-col items-center relative'>
									<Bell size={20} />
									<span className='text-xs hidden md:block'>Notifications</span>
									{unreadNotificationCount > 0 && (
										<span
											className='absolute -top-1 -right-1 md:right-4 bg-blue-500 text-white text-xs 
										rounded-full size-3 md:size-4 flex items-center justify-center'
										>
											{unreadNotificationCount}
										</span>
									)}
								</Link>
								<Link
									to={`/profile/${authUser.username}`}
									className='text-neutral flex flex-col items-center'
								>
									<User size={20} />
									<span className='text-xs hidden md:block'>Me</span>
								</Link>
								<button
									className='flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 cursor-pointer'
									onClick={() => logout()}
								>
									<LogOut size={20} />
									<span className='hidden md:inline'>Logout</span>
								</button>
							</>
						) : (
							<>
								<Link to='/login' className='btn btn-ghost'>
									Sign In
								</Link>
								<Link to='/signup' className='btn btn-primary'>
									Join now
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
};
export default Navbar;
