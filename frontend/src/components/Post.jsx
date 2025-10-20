import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import {
	Loader,
	MessageCircle,
	Send,
	Share2,
	ThumbsUp,
	Trash2,
} from "lucide-react";
import { MoreHorizontal, Image } from "lucide-react";
import PostAction from "./PostAction";




const Post = ({ post }) => {
	const { postId } = useParams();
	const queryClient = useQueryClient();
	const authUser = queryClient.getQueryData(["authUser"]);

	const [showComments, setShowComments] = useState(false);
	const [newComment, setNewComment] = useState("");
	const [comments, setComments] = useState(post.comments || []);

	const [showMenu, setShowMenu] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editedContent, setEditedContent] = useState(post.content);
	const [editedImage, setEditedImage] = useState(post.image || null);
	const [imagePreview, setImagePreview] = useState(post.image || null);

	const [expandedContent, setExpandedContent] = useState(false);
	const maxLength = 200;
	const isLongContent = post.content && post.content.length > maxLength;
	const displayedContent =
		expandedContent || !isLongContent
			? post.content
			: post.content.slice(0, maxLength);

	const isOwner = authUser._id === post.author._id;
	const isLiked = post.likes.includes(authUser._id);
	const commentSectionRef = useRef(null);

	const menuRef = useRef(null);
	const modalRef = useRef(null);

	// Close menu when click outside
	useEffect(() => {
		const handleClickOutsideMenu = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) {
				setShowMenu(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutsideMenu);
		return () => document.removeEventListener("mousedown", handleClickOutsideMenu);
	}, []);


	// Close comment outside click
	useEffect(() => {
		const handleClickOutsideComments = (e) => {
			if (
				commentSectionRef.current &&
				!commentSectionRef.current.contains(e.target)
			) {
				setShowComments(false);
			}
		};

		if (showComments) {
			document.addEventListener("mousedown", handleClickOutsideComments);
		} else {
			document.removeEventListener("mousedown", handleClickOutsideComments);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutsideComments);
		};
	}, [showComments]);


	// Close modal when click outside
	useEffect(() => {
		const handleClickOutsideModal = (e) => {
			if (modalRef.current && !modalRef.current.contains(e.target)) {
				setIsEditModalOpen(false);
			}
		};
		if (isEditModalOpen) {
			document.addEventListener("mousedown", handleClickOutsideModal);
		}
		return () => document.removeEventListener("mousedown", handleClickOutsideModal);
	}, [isEditModalOpen]);

	// Delete Post
	const { mutate: deletePost, isPending: isDeletingPost } = useMutation({
		mutationFn: async () => {
			await axiosInstance.delete(`/posts/delete/${post._id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			toast.success("Post deleted successfully");
		},
		onError: (err) => {
			toast.error(err.message);
		},
	});

	// Update Post
	const { mutate: updatePost, isPending: isUpdating } = useMutation({
		mutationFn: async () => {
			const postData = { content: editedContent };
			if (editedImage && typeof editedImage !== "string") {
				postData.image = await readFileAsDataURL(editedImage);
			}
			await axiosInstance.put(`/posts/update/${post._id}`, postData);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			queryClient.invalidateQueries({ queryKey: ["post", postId] });
			toast.success("Post updated successfully");
			setIsEditModalOpen(false);
		},
		onError: (err) => {
			toast.error(err.response?.data?.message || "Failed to update post");
		},
	});

	// Like Post
	const { mutate: likePost, isPending: isLikingPost } = useMutation({
		mutationFn: async () => {
			await axiosInstance.post(`/posts/${post._id}/like`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			queryClient.invalidateQueries({ queryKey: ["post", postId] });
		},
	});

	// Create Comment
	const { mutate: createComment, isPending: isAddingComment } = useMutation({
		mutationFn: async (comment) => {

			const response = await axiosInstance.post(`/posts/${post._id}/comment`, { content: comment });
			return response.data.comment;
		},
		onMutate: async (newCommentContent) => {
			await queryClient.cancelQueries({ queryKey: ["posts"] });

			const tempComment = {
				_id: Date.now() * -1,
				content: newCommentContent,
				user: {
					_id: authUser._id,
					name: authUser.name,
					profilePicture: authUser.profilePicture,
				},
				createdAt: new Date().toISOString(),
			};

			setComments((prev) => [...prev, tempComment]);
			setNewComment("");
			return { tempCommentId: tempComment._id };
		},
		onSuccess: (newCommentFromServer, _, context) => {
			setComments((prev) =>
				prev.map((c) => (c._id === context.tempCommentId ? newCommentFromServer : c))
			);
			toast.success("Comment added successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (err, _, context) => {
			setComments((prev) => prev.filter((c) => c._id !== context.tempCommentId));
			toast.error(err.response?.data?.message || "Failed to add comment");
		},
	});

	// const { mutate: createComment, isPending: isAddingComment } = useMutation({
	// 	mutationFn: async (comment) => {
	// 		await axiosInstance.post(`/posts/${post._id}/comment`, { content: comment });
	// 	},
	// 	onSuccess: () => {
	// 		queryClient.invalidateQueries({ queryKey: ["posts"] });
	// 		toast.success("Comment added successfully");
	// 	},
	// 	onError: (err) => {
	// 		toast.error(err.response?.data?.message || "Failed to add comment");
	// 	},
	// });

	// 🗑 Delete Comment


	const { mutate: deleteComment, isPending: isDeletingComment } = useMutation({
		mutationFn: async (commentId) => {
			await axiosInstance.delete(`/posts/${post._id}/comments/${commentId}`);
		},
		onSuccess: (_, commentId) => {
			setComments((prev) => prev.filter((c) => c._id !== commentId));
			toast.success("Comment deleted");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (err) => {
			toast.error(err.response?.data?.message || "Failed to delete comment");
		},
	});



	// Handlers
	const handleDeletePost = () => {
		if (!window.confirm("Are you sure you want to delete this post?")) return;
		deletePost();
	};

	const handleLikePost = () => {
		if (isLikingPost) return;
		likePost();
	};

	const handleAddComment = (e) => {
		e.preventDefault();
		const content = newComment.trim();
		if (!content) return;

		createComment(content);
	};

	const handleSharePost = async () => {
		const postUrl = `${window.location.origin}/posts/${post._id}`;
		if (navigator.share) {
			try {
				await navigator.share({ title: "Check out this post!", url: postUrl });
			} catch (err) {
				console.error("Share cancelled or failed:", err);
			}
		} else {
			try {
				await navigator.clipboard.writeText(postUrl);
				toast.success("Link copied to clipboard!");
			} catch {
				toast.error("Share not supported in this browser");
			}
		}
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setEditedImage(file);
			const reader = new FileReader();
			reader.onloadend = () => setImagePreview(reader.result);
			reader.readAsDataURL(file);
		} else {
			setEditedImage(null);
			setImagePreview(null);
		}
	};

	const readFileAsDataURL = (file) =>
		new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});

	return (
		<div className='bg-secondary rounded-lg shadow mb-2 md:mb-4 lg:mb-4'>
			<div className='p-4'>
				{/* Header */}
				<div className='flex items-center justify-between mb-4'>
					<div className='flex items-center'>
						<Link to={`/profile/${post?.author?.username}`}>
							<img
								src={post.author.profilePicture || "/avatar.png"}
								alt={post.author.name}
								className='size-14 rounded-full mr-3'
							/>
						</Link>
						<div>
							<Link to={`/profile/${post?.author?.username}`}>
								<h3 className='font-semibold'>{post.author.name}</h3>
							</Link>
							<p className='text-xs text-info truncate max-w-[200px] md:max-w-[250px] lg:max-w-[350px]'>{post.author.headline}</p>
							<p className='text-xs text-info'>
								{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
							</p>
						</div>
					</div>

					{isOwner && (
						<div
							ref={menuRef}
							className='relative'>
							<button
								onClick={() => setShowMenu(!showMenu)}
								className='p-2 rounded-full hover:bg-gray-200 cursor-pointer'
							>
								<MoreHorizontal size={18} />
							</button>

							{showMenu && (
								<div className='absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg shadow-gray-300 z-10'>
									<button
										onClick={() => {
											setIsEditModalOpen(true);
											setShowMenu(false);
										}}
										className='w-full text-left px-4 py-2 hover:bg-gray-200'
									>
										Edit
									</button>
									<button
										onClick={() => {
											handleDeletePost();
											setShowMenu(false);
										}}
										className='w-full text-left px-4 py-2 text-red-500 hover:bg-gray-200 flex items-center justify-between'
										disabled={isDeletingPost}
									>
										<span>Delete</span>
										{isDeletingPost && <Loader size={16} className='animate-spin' />}
									</button>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Post content */}
				<div className='mb-4'>
					<p className='text-base text-gray-800 mb-1 whitespace-pre-wrap'>
						{displayedContent}
						{isLongContent && !expandedContent && (
							<span
								onClick={() => setExpandedContent(true)}
								className='text-gray-500 text-sm hover:text-blue-800 cursor-pointer hover:underline'
							>
								.... more
							</span>
						)}
						{expandedContent && (
							<span
								onClick={() => setExpandedContent(false)}
								className='text-gray-500 text-sm hover:text-blue-800 cursor-pointer hover:underline'
							>
								.... less
							</span>
						)}
					</p>

					{post.image && (
						<div className='w-full max-h-[500px] overflow-hidden rounded-lg mb-4'>
							<img
								src={post.image}
								alt='Post content'
								className='w-full h-auto object-cover transition-transform duration-200 hover:scale-105'
							/>
						</div>
					)}
				</div>

				{/* Actions */}
				<div className='flex justify-between text-info'>
					<PostAction
						icon={<ThumbsUp size={18} className={isLiked ? "text-blue-500 fill-blue-300" : ""} />}
						text={`Like (${post.likes.length})`}
						onClick={handleLikePost}
					/>

					<PostAction
						icon={<MessageCircle size={18} />}
						text={`Comment (${comments.length})`}
						onClick={() => setShowComments(!showComments)}
					/>

					<PostAction
						icon={<Share2 size={18} />}
						text='Share'
						onClick={handleSharePost}
					/>
				</div>
			</div>

			{/* Comments */}
			{showComments && (
				<div
					ref={commentSectionRef}
					className='px-4 pb-4'>
					<div className='mb-4 max-h-60 overflow-y-auto'>
						{comments.map((comment, index) => (
							<div
								key={comment._id || `${comment.user._id}-${comment.createdAt}-${index}`}
								className='mb-2 bg-base-100 p-2 rounded flex items-start'
							>
								<img
									src={comment.user.profilePicture || "/avatar.png"}
									alt={comment.user.name}
									className='w-8 h-8 rounded-full mr-2 flex-shrink-0'
								/>
								<div className='flex-grow'>
									<div className='flex items-center mb-1'>
										<span className='font-semibold mr-2'>{comment.user.name}</span>
										<span className='text-xs text-info'>
											{formatDistanceToNow(new Date(comment.createdAt))}
										</span>
									</div>
									<p>{comment.content}</p>
								</div>

								{/* Delete comment */}
								{authUser._id === comment.user._id && (
									<button
										onClick={() => deleteComment(comment._id)}
										className='text-red-500 hover:text-red-700 cursor-pointer pt-1 pr-1'
										disabled={isDeletingComment}
									>
										{isDeletingComment ? (
											<Loader size={18} className='animate-spin' />
										) : (
											<Trash2 size={18} />
										)}
									</button>
								)}
							</div>
						))}
					</div>

					<form onSubmit={handleAddComment} className='flex items-center'>
						<input
							type='text'
							value={newComment}
							onChange={(e) => setNewComment(e.target.value)}
							placeholder='Add a comment...'
							className='flex-grow p-2 pl-4 rounded-l-full bg-base-100 focus:outline-none focus:ring-1 focus:ring-primary'
						/>

						<button
							type='submit'
							className='bg-primary text-white p-2 rounded-r-full hover:bg-primary-dark transition duration-300 cursor-pointer'
							disabled={isAddingComment}
						>
							{isAddingComment ? <Loader size={22} className='animate-spin' /> : <Send size={22} />}
						</button>
					</form>
				</div>
			)}

			{/* Edit Modal */}
			{isEditModalOpen && (
				<div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50'>
					<div
						ref={modalRef}
						className='bg-secondary rounded-lg w-full max-w-[700px] max-h-[600px] p-6 relative'>
						<button
							onClick={() => setIsEditModalOpen(false)}
							className='absolute top-2 right-2 text-black text-[20px] p-1 rounded-full h-10 w-10 hover:bg-gray-200 cursor-pointer'
						>
							✕
						</button>

						<h2 className='text-lg font-semibold mb-4'>Edit Post</h2>

						<textarea
							className='w-full p-3 rounded-lg focus:outline-none resize-none mb-2'
							value={editedContent}
							onChange={(e) => setEditedContent(e.target.value)}
							rows={10}
						/>

						{imagePreview && (
							<div className='w-50 overflow-hidden rounded-lg mb-2'>
								<img
									src={imagePreview}
									alt='Preview'
									className='w-full object-cover'
								/>
							</div>
						)}

						<div className='flex justify-end items-center space-x-3 my-4'>
							<label className='flex items-center text-info hover:text-info-dark cursor-pointer p-2 bg-gray-200 hover:bg-gray-300 rounded'>
								<Image size={20} className='mr-1' />
								<span>Photo</span>
								<input type='file' accept='image/*' className='hidden' onChange={handleImageChange} />
							</label>

							<button
								onClick={() => updatePost()}
								className=' px-4 py-2 text-base rounded bg-primary text-white hover:bg-blue-700'
								disabled={isUpdating}
							>
								{isUpdating ? <Loader size={18} className='animate-spin' /> : "Save"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Post;






// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useState } from "react";
// import { axiosInstance } from "../lib/axios";
// import toast from "react-hot-toast";
// import { Link, useParams } from "react-router-dom";
// import { Loader, MessageCircle, Send, Share2, ThumbsUp, Trash2 } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";

// import PostAction from "./PostAction";

// const Post = ({ post }) => {
// 	const { postId } = useParams();

// 	// More & Less
// 	const [expandedContent, setExpandedContent] = useState(false);
// 	const maxLength = 200;

// 	const isLongContent = post.content && post.content.length > maxLength;
// 	const displayedContent =
// 		expandedContent || !isLongContent
// 			? post.content
// 			: post.content.slice(0, maxLength);

// 	// const { data: authUser } = useQuery({ queryKey: ["authUser"] });

// 	const queryClient = useQueryClient();
// 	const authUser = queryClient.getQueryData(["authUser"]);

// 	const [showComments, setShowComments] = useState(false);
// 	const [newComment, setNewComment] = useState("");
// 	const [comments, setComments] = useState(post.comments || []);
// 	const isOwner = authUser._id === post.author._id;
// 	const isLiked = post.likes.includes(authUser._id);

// 	const { mutate: deletePost, isPending: isDeletingPost } = useMutation({
// 		mutationFn: async () => {
// 			await axiosInstance.delete(`/posts/delete/${post._id}`);
// 		},
// 		onSuccess: () => {
// 			queryClient.invalidateQueries({ queryKey: ["posts"] });
// 			toast.success("Post deleted successfully");
// 		},
// 		onError: (error) => {
// 			toast.error(error.message);
// 		},
// 	});

// 	const { mutate: createComment, isPending: isAddingComment } = useMutation({
// 		mutationFn: async (newComment) => {
// 			await axiosInstance.post(`/posts/${post._id}/comment`, { content: newComment });
// 		},
// 		onSuccess: () => {
// 			queryClient.invalidateQueries({ queryKey: ["posts"] });
// 			toast.success("Comment added successfully");
// 		},
// 		onError: (err) => {
// 			toast.error(err.response.data.message || "Failed to add comment");
// 		},
// 	});

// 	const { mutate: likePost, isPending: isLikingPost } = useMutation({
// 		mutationFn: async () => {
// 			await axiosInstance.post(`/posts/${post._id}/like`);
// 		},
// 		onSuccess: () => {
// 			queryClient.invalidateQueries({ queryKey: ["posts"] });
// 			queryClient.invalidateQueries({ queryKey: ["post", postId] });
// 		},
// 	});

// 	const handleDeletePost = () => {
// 		if (!window.confirm("Are you sure you want to delete this post?")) return;
// 		deletePost();
// 	};

// 	const handleLikePost = async () => {
// 		if (isLikingPost) return;
// 		likePost();
// 	};

// 	const handleAddComment = async (e) => {
// 		e.preventDefault();
// 		if (newComment.trim()) {
// 			createComment(newComment);
// 			setNewComment("");
// 			setComments([
// 				...comments,
// 				{
// 					content: newComment,
// 					user: {
// 						_id: authUser._id,
// 						name: authUser.name,
// 						profilePicture: authUser.profilePicture,
// 					},
// 					createdAt: new Date(),
// 				},
// 			]);
// 		}
// 	};

// 	const handleSharePost = async () => {
// 		const postUrl = `${window.location.origin}/posts/${post._id}`;

// 		if (navigator.share) {
// 			try {
// 				await navigator.share({
// 					title: "Check out this post!",
// 					url: postUrl,
// 				});
// 			} catch (err) {
// 				console.error("Share cancelled or failed:", err);
// 			}
// 		} else {
// 			try {
// 				await navigator.clipboard.writeText(postUrl);
// 				toast.success("Link copied to clipboard!");
// 			} catch (err) {
// 				toast.error("Share not supported in this browser");
// 			}
// 		}
// 	};


// 	return (
// 		<div className='bg-secondary rounded-lg shadow mb-4'>
// 			<div className='p-4'>
// 				<div className='flex items-center justify-between mb-4'>
// 					<div className='flex items-center'>
// 						<Link to={`/profile/${post?.author?.username}`}>
// 							<img
// 								src={post.author.profilePicture || "/avatar.png"}
// 								alt={post.author.name}
// 								className='size-10 rounded-full mr-3'
// 							/>
// 						</Link>

// 						<div>
// 							<Link to={`/profile/${post?.author?.username}`}>
// 								<h3 className='font-semibold'>{post.author.name}</h3>
// 							</Link>
// 							<p className='text-xs text-info'>{post.author.headline}</p>
// 							<p className='text-xs text-info'>
// 								{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
// 							</p>
// 						</div>
// 					</div>
// 					{isOwner && (
// 						<button
// 							onClick={handleDeletePost}
// 							className='text-red-500 hover:text-red-700 cursor-pointer'>
// 							{isDeletingPost ? <Loader size={18} className='animate-spin' /> : <Trash2 size={18} />}
// 						</button>
// 					)}
// 				</div>

// 				<div className='mb-4'>
// 					{post.content && (
// 						<p className='text-base text-gray-800 mb-3 whitespace-pre-wrap'>
// 							{displayedContent}
// 							{isLongContent && !expandedContent && (
// 								<span
// 									onClick={() => setExpandedContent(true)}
// 									className='text-gray-500 text-sm hover:text-blue-800 cursor-pointer ml-1 hover:underline'
// 								>
// 									.... more
// 								</span>
// 							)}
// 							{expandedContent && (
// 								<span
// 									onClick={() => setExpandedContent(false)}
// 									className='text-gray-500 text-sm hover:text-blue-800 cursor-pointer ml-1 hover:underline'
// 								>
// 									.... less
// 								</span>
// 							)}
// 						</p>
// 					)}

// 					{post.image && (
// 						<div className='w-full max-h-[500px] overflow-hidden rounded-lg mb-4'>
// 							<img
// 								src={post.image}
// 								alt='Post content'
// 								className='w-full h-auto object-cover transition-transform duration-200 hover:scale-105'
// 							/>
// 						</div>
// 					)}
// 				</div>

// 				<div className='flex justify-between text-info'>
// 					<PostAction
// 						icon={<ThumbsUp size={18} className={isLiked ? "text-blue-500  fill-blue-300" : ""} />}
// 						text={`Like (${post.likes.length})`}
// 						onClick={handleLikePost}
// 					/>

// 					<PostAction
// 						icon={<MessageCircle size={18} />}
// 						text={`Comment (${comments.length})`}
// 						onClick={() => setShowComments(!showComments)}
// 					/>

// 					<PostAction
// 						icon={<Share2 size={18} />}
// 						text='Share'
// 						onClick={handleSharePost}
// 					/>
// 				</div>
// 			</div>

// 			{showComments && (
// 				<div className='px-4 pb-4'>
// 					<div className='mb-4 max-h-60 overflow-y-auto'>
// 						{comments.map((comment, index) => (
// 							<div
// 								key={comment._id || `${comment.user._id}-${comment.createdAt}-${index}`}
// 								className='mb-2 bg-base-100 p-2 rounded flex items-start'
// 							>
// 								<img
// 									src={comment.user.profilePicture || "/avatar.png"}
// 									alt={comment.user.name}
// 									className='w-8 h-8 rounded-full mr-2 flex-shrink-0'
// 								/>
// 								<div className='flex-grow'>
// 									<div className='flex items-center mb-1'>
// 										<span className='font-semibold mr-2'>{comment.user.name}</span>
// 										<span className='text-xs text-info'>
// 											{formatDistanceToNow(new Date(comment.createdAt))}
// 										</span>
// 									</div>
// 									<p>{comment.content}</p>
// 								</div>
// 							</div>
// 						))}
// 					</div>

// 					<form onSubmit={handleAddComment} className='flex items-center'>
// 						<input
// 							type='text'
// 							value={newComment}
// 							onChange={(e) => setNewComment(e.target.value)}
// 							placeholder='Add a comment...'
// 							className='flex-grow p-2 rounded-l-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary'
// 						/>

// 						<button
// 							type='submit'
// 							className='bg-primary text-white p-2 rounded-r-full hover:bg-primary-dark transition duration-300'
// 							disabled={isAddingComment}
// 						>
// 							{isAddingComment ? <Loader size={18} className='animate-spin' /> : <Send size={18} />}
// 						</button>
// 					</form>
// 				</div>
// 			)}
// 		</div>
// 	);
// };
// export default Post;