import cloudinary from "../lib/cloudinary.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js"
import Notification from "../models/notification.model.js";
import { sendCommentNotificationEmail } from "../emails/emailHandlers.js";

export const getFeedPosts = async (req, res) => {
	try {
		const posts = await Post.find({ author: { $in: [...req.user.connections, req.user._id] } })
			.populate("author", "name username profilePicture headline")
			.populate("comments.user", "name profilePicture")
			.sort({ createdAt: -1 });

		res.status(200).json(posts);
	} catch (error) {
		console.error("Error in getFeedPosts controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

export const createPost = async (req, res) => {
	try {
		const { content, image } = req.body;
		let newPost;

		if (image) {
			const imgResult = await cloudinary.uploader.upload(image);
			newPost = new Post({
				author: req.user._id,
				content,
				image: imgResult.secure_url,
			});
		} else {
			newPost = new Post({
				author: req.user._id,
				content,
			});
		}

		await newPost.save();

		res.status(201).json(newPost);
	} catch (error) {
		console.error("Error in createPost controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};


export const updatePost = async (req, res) => {
	try {
		const { id } = req.params;
		const { content, image } = req.body;
		const userId = req.user._id;

		const post = await Post.findById(id);
		if (!post) return res.status(404).json({ message: "Post not found" });

		if (post.author.toString() !== userId.toString()) {
			return res.status(403).json({ message: "You can't edit this post" });
		}

		if (content !== undefined) post.content = content;
		if (image !== undefined) post.image = image;

		const updatedPost = await post.save();
		res.status(200).json(updatedPost);
	} catch (err) {
		console.error("Error updating post:", err);
		res.status(500).json({ message: "Failed to update post" });
	}
};


export const deletePost = async (req, res) => {
	try {
		const postId = req.params.id;
		const userId = req.user._id;

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		if (post.author.toString() !== userId.toString()) {
			return res.status(403).json({ message: "You are not authorized to delete this post" });
		}

		if (post.image) {
			await cloudinary.uploader.destroy(post.image.split("/").pop().split(".")[0]);
		}

		await Post.findByIdAndDelete(postId);

		res.status(200).json({ message: "Post deleted successfully" });
	} catch (error) {
		console.log("Error in delete post controller", error.message);
		res.status(500).json({ message: "Server error" });
	}
};

export const getPostById = async (req, res) => {
	try {
		const postId = req.params.id;
		const post = await Post.findById(postId)
			.populate("author", "name username profilePicture headline")
			.populate("comments.user", "name profilePicture username headline");

		res.status(200).json(post);
	} catch (error) {
		console.error("Error in getPostById controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Create Comment 
export const createComment = async (req, res) => {
	try {
		const postId = req.params.id;
		const { content } = req.body;
		const userId = req.user._id;

		const commenter = await User.findById(userId).select("name email username");
		if (!commenter) {
			return res.status(404).json({ message: "Commenter not found" });
		}

		const updatedPost = await Post.findByIdAndUpdate(
			postId,
			{ $push: { comments: { user: userId, content } } },
			{ new: true }
		);

		if (!updatedPost) {
			return res.status(404).json({ message: "Post not found" });
		}

		const postWithAuthor = await Post.findById(postId)
			.populate("author", "name email username")
			.populate("comments.user", "name profilePicture username headline");

		const newComment = postWithAuthor.comments.slice(-1)[0];

		res.status(201).json({
			message: "Comment created successfully",
			comment: newComment,
		});

		if (postWithAuthor.author._id.toString() !== userId.toString()) {
			(async () => {
				try {
					const newNotification = new Notification({
						recipient: postWithAuthor.author._id,
						type: "comment",
						relatedUser: userId,
						relatedPost: postId,
					});
					await newNotification.save();

					// const postUrl = `${process.env.CLIENT_URL || "https://linkedin-clone-dev.vercel.app"}/post/${postId}`;
					const postUrl = `${process.env.CLIENT_URL}/post/${postId}`;

					console.log("Sending comment email to:", postWithAuthor.author.email);
					await sendCommentNotificationEmail(
						postWithAuthor.author.email,
						postWithAuthor.author.name,
						commenter.name,
						postUrl,
						content
					);
					console.log("Comment notification email sent successfully!");
				} catch (emailError) {
					console.error("Error sending comment notification email:", emailError);
				}
			})();
		}
	} catch (error) {
		console.error("Error in createComment controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};


// Delete a comment
export const deleteComment = async (req, res) => {
	const { postId, commentId } = req.params;

	try {
		const post = await Post.findById(postId);
		if (!post) return res.status(404).json({ message: "Post not found" });

		const comment = post.comments.id(commentId);
		if (!comment) return res.status(404).json({ message: "Comment not found" });

		if (comment.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Not authorized" });
		}

		comment.deleteOne();
		await post.save();

		res.json({ message: "Comment deleted" });
	} catch (err) {
		res.status(500).json({ message: "Server error", error: err.message });
	}
};


export const likePost = async (req, res) => {
	try {
		const postId = req.params.id;
		const post = await Post.findById(postId);
		const userId = req.user._id;

		if (post.likes.includes(userId)) {
			post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
		} else {
			post.likes.push(userId);
			if (post.author.toString() !== userId.toString()) {
				const newNotification = new Notification({
					recipient: post.author,
					type: "like",
					relatedUser: userId,
					relatedPost: postId,
				});

				await newNotification.save();
			}
		}

		await post.save();

		res.status(200).json(post);
	} catch (error) {
		console.error("Error in likePost controller:", error);
		res.status(500).json({ message: "Server error" });
	}
};





// export const createComment = async (req, res) => {
// 	try {
// 		const postId = req.params.id;
// 		const { content } = req.body;
// 		const userId = req.user._id;

// 		const updatedPost = await Post.findByIdAndUpdate(
// 			postId,
// 			{ $push: { comments: { user: userId, content } } },
// 			{ new: true }
// 		).populate("author", "name email");

// 		if (!updatedPost) {
// 			return res.status(404).json({ message: "Post not found" });
// 		}

// 		const newCommentSubdocument = updatedPost.comments[updatedPost.comments.length - 1];

// 		const postWithPopulatedComments = await Post.findById(postId)
// 			.populate("comments.user", "name profilePicture username headline");

// 		const fullyPopulatedNewComment = postWithPopulatedComments.comments.find(
// 			c => c._id.equals(newCommentSubdocument._id)
// 		);

// 		if (updatedPost.author._id.toString() !== userId.toString()) {
// 			const newNotification = new Notification({
// 				recipient: updatedPost.author,
// 				type: "comment",
// 				relatedUser: userId,
// 				relatedPost: postId,
// 			});

// 			await newNotification.save();

// 			try {
// 				// const postUrl = process.env.CLIENT_URL + "/post/" + postId;
// 				const postUrl = `${process.env.CLIENT_URL || "https://linkedin-clone-dev.vercel.app"}/post/${postId}`;

// 				await sendCommentNotificationEmail(
// 					updatedPost.author.email,
// 					updatedPost.author.name,
// 					req.user.name,
// 					postUrl,
// 					content
// 				);
// 			} catch (error) {
// 				console.log("Error in sending comment notification email:", error);
// 			}
// 		}
// 		res.status(201).json({
// 			message: "Comment created successfully",
// 			comment: fullyPopulatedNewComment
// 		});

// 	} catch (error) {
// 		console.error("Error in createComment controller:", error);
// 		res.status(500).json({ message: "Server error" });
// 	}
// };