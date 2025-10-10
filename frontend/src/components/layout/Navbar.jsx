import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Home, LogOut, Search, User, Users } from "lucide-react";

const Navbar = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);

	const navigate = useNavigate();
	const dropdownRef = useRef(null);

	// const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	// const authUser = queryClient.getQueryData(["authUser"]);
	const queryClient = useQueryClient();

	const { data: authUser } = useQuery({
		queryKey: ["authUser"],
		queryFn: async () => {
			try {
				const res = await axiosInstance.get("/auth/me");
				return res.data;
			} catch (error) {
				if (error.response?.status === 401) {
					return null;
				}
				throw error;
			}
		},
	});


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
		cacheTime: 500,
	});

	useEffect(() => {
		if (searchData) {
			setSearchResults(searchData);
			setHighlightedIndex(-1);
		} else {
			setSearchResults([]);
		}
	}, [searchData]);

	const handleKeyDown = (e) => {
		if (searchResults.length > 0) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setHighlightedIndex((prevIndex) =>
					prevIndex < searchResults.length - 1 ? prevIndex + 1 : prevIndex
				);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setHighlightedIndex((prevIndex) =>
					prevIndex > 0 ? prevIndex - 1 : -1
				);
			} else if (e.key === "Enter") {
				if (highlightedIndex !== -1) {
					e.preventDefault();
					const user = searchResults[highlightedIndex];
					navigate(`/profile/${user.username}`);
					setSearchQuery("");
					setSearchResults([]);
					setHighlightedIndex(-1);
				}
			}
		}
	};

	const unreadNotificationCount = notifications?.data.filter((notif) => !notif.read).length;
	const unreadConnectionRequestsCount = connectionRequests?.data?.length;

	return (
		<nav className='bg-secondary shadow-md sticky top-0 z-10 md:px-4'>
			<div className='max-w-7xl mx-auto px-4'>
				<div className='flex justify-between items-center py-3'>
					<div className='flex items-center space-x-4'>
						<Link to='/'>
							<img className='h-8 rounded' src='/small-logo.png' alt='LinkedIn' />
						</Link>
						{/* Search bar */}
						{authUser && (
							<div className="relative flex items-center h-8 border py-1 px-4 rounded-full bg-white">
								<Search size={16} />
								<input
									type="text"
									placeholder="Search"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									onKeyDown={handleKeyDown}
									className="ml-2 text-[16px] outline-none flex-1"
								/>
								{/* Search dropdown */}
								{searchQuery.trim() && (
									<div
										ref={dropdownRef}
										className="absolute top-full left-0 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-y-auto z-20"
									>
										{isFetching && (
											<div className="px-4 py-2 text-gray-500">Searching...</div>
										)}
										{!isFetching && searchResults.length === 0 && (
											<div className="px-4 py-2 text-gray-500">No results found</div>
										)}
										{searchResults.map((user, index) => (
											<Link
												key={user._id}
												to={`/profile/${user.username}`}
												className={`block px-4 py-2 hover:bg-gray-100 ${index === highlightedIndex ? "bg-gray-300" : ""
													}`}
												onClick={() => setSearchQuery("")}
											>
												{user.name}
											</Link>
										))}
									</div>
								)}
							</div>
						)}
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