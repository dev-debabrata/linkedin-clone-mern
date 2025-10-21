import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, Home, LogOut, Search, User, Users, SquarePlus, X } from "lucide-react";


const Navbar = () => {

	const location = useLocation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [isSearchActive, setIsSearchActive] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const searchWrapperRef = useRef(null);
	const searchInputRef = useRef(null);
	const dropdownRef = useRef(null);



	// Auth user
	const { data: authUser } = useQuery({
		queryKey: ["authUser"],
		queryFn: async () => {
			try {
				const res = await axiosInstance.get("/auth/me");
				return res.data;
			} catch (error) {
				if (error.response?.status === 401) return null;
				throw error;
			}
		},
	});

	// Notifications
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

	// Logout mutation
	const { mutate: logout } = useMutation({
		mutationFn: () => axiosInstance.post("/auth/logout"),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
	});

	// Profile Dropdown
	useEffect(() => {
		function handleClickOutside(e) {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
				setIsDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);


	// Search query
	const { data: searchData, isFetching } = useQuery({
		queryKey: ["searchUsers", searchQuery],
		queryFn: async () => {
			if (!searchQuery.trim()) return [];
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

	// Close search on route change
	useEffect(() => {
		setIsSearchActive(false);
		setSearchQuery("");
		setHighlightedIndex(-1);

	}, [location.pathname]);

	// Handle keyboard navigation
	const handleKeyDown = (e) => {
		if (searchResults.length > 0) {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev < searchResults.length - 1 ? prev + 1 : prev
				);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
			} else if (e.key === "Enter") {
				if (highlightedIndex !== -1) {
					const user = searchResults[highlightedIndex];
					handleSearchResultClick(user.username);
				}
			}
		}
	};

	// Click search result
	const handleSearchResultClick = (username) => {
		setIsSearchActive(false);
		setSearchQuery("");
		setHighlightedIndex(-1);
		navigate(`/profile/${username}`);
	};

	// Click outside to close
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				searchWrapperRef.current &&
				!searchWrapperRef.current.contains(event.target) &&
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target)
			) {
				setIsSearchActive(false);
				setSearchQuery("");
				setHighlightedIndex(-1);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const unreadNotificationCount = notifications?.data.filter((notif) => !notif.read).length;
	const unreadConnectionRequestsCount = connectionRequests?.data?.length;


	return (
		<>
			{/* Overlay Search */}
			{isSearchActive && (
				<div
					className="fixed inset-0 bg-black/50 z-20 transition-opacity duration-200"
					onClick={() => setIsSearchActive(false)}
				/>
			)}

			{/* Navbar */}
			<nav className="bg-secondary shadow-md sticky top-0 z-40 md:px-4">
				<div className="max-w-7xl mx-auto px-4">
					<div className="flex justify-between items-center py-2">
						<div className="flex items-center justify-center gap-4">
							<Link to="/">
								<img className="h-8 rounded" src="/small-logo.png" alt="LinkedIn" />
							</Link>

							{/* Search */}
							{authUser && (
								<div
									ref={searchWrapperRef}
									onClick={() => {
										searchInputRef.current?.focus();
										setIsSearchActive(true);
									}}
									className="relative flex items-center h-8 w-[290px] md:w-[245px] lg:w-[245px]  border border-gray-400 py-1 px-4 rounded-full bg-white focus-within:bg-gray-200 focus-within:border-black focus-within:border-2 md:focus-within:w-[400px] lg:focus-within:w-[400px] cursor-text z-40"
								>
									<Search size={16} />
									<input
										ref={searchInputRef}
										type="text"
										placeholder="Search"
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										onKeyDown={handleKeyDown}
										className="ml-2 text-[16px] outline-none flex-1 bg-transparent"
									/>

									{/* Dropdown */}
									{searchQuery.trim() && (
										<div
											ref={dropdownRef}
											className="absolute top-full left-0 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-y-auto z-50"
										>
											{isFetching && (
												<div className="px-4 py-2 text-gray-500">Searching...</div>
											)}
											{!isFetching && searchResults.length === 0 && (
												<div className="px-4 py-2 text-gray-500">No results found</div>
											)}
											{searchResults.map((user, index) => (
												<div
													key={user._id}
													className={`flex items-center px-4 py-3 hover:bg-gray-100 transition-colors duration-100 cursor-pointer ${index === highlightedIndex ? "bg-gray-300" : ""
														}`}
													onClick={() => handleSearchResultClick(user.username)}
												>
													<div className="h-8 w-8 rounded-full mr-3 overflow-hidden bg-gray-200 flex items-center justify-center">
														<img
															src={user.profilePicture || "/avatar.png"}
															alt={`${user.name}'s avatar`}
															className="w-full h-full object-cover"
														/>
													</div>

													<div className="flex flex-col">
														<span className="text-sm font-medium text-gray-800">{user.name}</span>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</div>

						{/* Right Menu */}
						<div className="flex items-center gap-2">
							{authUser ? (
								<>
									<div className=" md:flex lg:flex items-center gap-2 md:gap-6">
										<div className="hidden md:flex lg:flex items-center gap-2 md:gap-6">
											<Link to="/" className="text-neutral flex flex-col items-center">
												<Home size={20} />
												<span className="text-xs hidden md:block">Home</span>
											</Link>

											<Link
												to="/network"
												className="text-neutral flex flex-col items-center relative"
											>
												<Users size={20} />
												<span className="text-xs hidden md:block">My Network</span>
												{unreadConnectionRequestsCount > 0 && (
													<span className="absolute -top-1 -right-1 md:right-4 bg-red-700 text-white text-xs rounded-full size-3 md:size-4 flex items-center justify-center">
														{unreadConnectionRequestsCount}
													</span>
												)}
											</Link>

											<Link
												to="/notifications"
												className="text-neutral flex flex-col items-center relative"
											>
												<Bell size={20} />
												<span className="text-xs hidden md:block">Notifications</span>
												{unreadNotificationCount > 0 && (
													<span className="absolute -top-1 -right-1 md:right-4 bg-red-700 text-white text-xs rounded-full size-3 md:size-4 flex items-center justify-center">
														{unreadNotificationCount}
													</span>
												)}
											</Link>
										</div>

										{/* <Link
											to={`/profile/${authUser.username}`}
											className="text-neutral flex flex-col items-center"
										>
											<User size={20} />
											<span className="text-xs hidden md:block">Me</span>
										</Link> */}

										{/* <button
											className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
											onClick={() => logout()}
										>
											<LogOut size={20} />
											<span className="hidden md:inline">Sign out</span>
										</button> */}

										{/* ✅ Profile Picture */}
										<div className="relative " ref={dropdownRef}>
											<button
												onClick={() => setIsDropdownOpen((prev) => !prev)}
												className="focus:outline-none text-neutral flex flex-col items-center cursor-pointer"
											>
												<img
													src={authUser?.profilePicture || "/avatar.png"}
													alt={authUser?.name || "Profile"}
													className="size-8 md:size-[22px] lg:size-[22px] rounded-full object-cover border border-gray-300 hover:opacity-90 transition"
												/>
												<span className="text-xs hidden md:block lg:block">Me</span>
											</button>

											{isDropdownOpen && (
												<div className="absolute right-0 mt-2 w-40 bg-white shadow-gray-900 shadow-2xl rounded-lg py-2 z-50">
													<Link
														to={`/profile/${authUser?.username}`}
														onClick={() => setIsDropdownOpen(false)}
														className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
													>
														<User size={16} className="mr-2" />
														Profile
													</Link>
													<button
														onClick={() => logout()}
														className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
													>
														<LogOut size={16} className="mr-2" />
														Sign out
													</button>
												</div>
											)}
										</div>

									</div>



								</>
							) : (
								<>
									<Link to="/login" className="btn btn-ghost px-5 py-1 rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-200 flex items-center">
										Sign In
									</Link>
									<Link to="/signup" className="btn btn-primary px-5 py-1 rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition-colors duration-200 flex items-center">
										Join now
									</Link>
								</>
							)}
						</div>
					</div>
				</div>
			</nav>

			{/* Mobile Bottom Menu */}
			{authUser && (
				<div className="fixed bottom-0 left-0 right-0 bg-white shadow-inner border-none md:hidden z-50">
					<div className="flex justify-around">
						{/* Home */}
						<Link
							to="/"
							className={`flex flex-col items-center border-none px-5 py-2 ${location.pathname === "/"
								? "text-blue-600 bg-gray-200"
								: "text-gray-600"
								}`}
						>
							<Home size={22} />
							<span className="text-[10px] mt-1">Home</span>
						</Link>

						{/* My Network */}
						<Link
							to="/network"
							className={`flex flex-col items-center relative border-none px-5 py-2 ${location.pathname.startsWith("/network")
								? "text-blue-600 bg-gray-200"
								: "text-gray-600"
								}`}
						>
							<Users size={22} />
							<span className="text-[10px] mt-1">My Network</span>
							{unreadConnectionRequestsCount > 0 && (
								<span className="absolute top-1 right-8 bg-red-700 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
									{unreadConnectionRequestsCount}
								</span>
							)}
						</Link>

						{/* Post Create */}
						<Link
							to="/create-post"
							className={`flex flex-col items-center border-none px-5 py-2 ${location.pathname === "/create-post" ? "text-blue-600 bg-gray-200" : "text-gray-600"
								}`}
						>
							<SquarePlus size={22} />
							<span className="text-[10px] mt-1">Post</span>
						</Link>

						{/* Notifications */}
						<Link
							to="/notifications"
							className={`flex flex-col items-center relative border-none px-5 py-2 ${location.pathname.startsWith("/notifications")
								? "text-blue-600 bg-gray-200"
								: "text-gray-600"
								}`}
						>
							<Bell size={22} />
							<span className="text-[10px] mt-1">Notifications</span>
							{unreadNotificationCount > 0 && (
								<span className="absolute top-1 right-8 bg-red-700 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
									{unreadNotificationCount}
								</span>
							)}
						</Link>

						{/* Profile */}
						<Link
							to={`/profile/${authUser.username}`}
							className={`flex flex-col items-center border-none px-5 py-2 ${location.pathname.startsWith(`/profile/${authUser.username}`)
								? "text-blue-600 bg-gray-200"
								: "text-gray-600"
								}`}
						>
							<User size={22} />
							<span className="text-[10px] mt-1">Me</span>
						</Link>
					</div>
				</div>
			)}
		</>
	);
};

export default Navbar;
