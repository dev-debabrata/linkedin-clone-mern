import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Image, Loader } from "lucide-react";

const PostCreation = ({ user }) => {
	const [content, setContent] = useState("");
	const [image, setImage] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);

	const queryClient = useQueryClient();

	const { mutate: createPostMutation, isPending } = useMutation({
		mutationFn: async (postData) => {
			const res = await axiosInstance.post("/posts/create", postData, {
				headers: { "Content-Type": "application/json" },
			});
			return res.data;
		},
		onSuccess: () => {
			resetForm();
			toast.success("Post created successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (err) => {
			toast.error(err.response.data.message || "Failed to create post");
		},
	});

	const handlePostCreation = async () => {
		try {
			const postData = { content };
			if (image) postData.image = await readFileAsDataURL(image);

			createPostMutation(postData);
		} catch (error) {
			console.error("Error in handlePostCreation:", error);
		}
	};

	const resetForm = () => {
		setContent("");
		setImage(null);
		setImagePreview(null);
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		setImage(file);
		if (file) {
			readFileAsDataURL(file).then(setImagePreview);
		} else {
			setImagePreview(null);
		}
	};

	const readFileAsDataURL = (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	};

	return (
		<div className='bg-secondary rounded-lg shadow mb-2 md:mb-4 lg:mb-4 p-4'>
			<div className='flex space-x-3'>
				<img
					src={user.profilePicture || "/avatar.png"}
					alt={user.name}
					className='size-10 rounded-full hidden md:block lg:block' />
				<textarea
					placeholder="What's on your mind?"
					className='w-full p-2 rounded-lg bg-base-100 hover:bg-base-200 focus:bg-base-200 focus:outline-none resize-none transition-colors duration-200 h-[250px] md:h-[100px] lg:h-[100px]'
					value={content}
					onChange={(e) => setContent(e.target.value)}
				/>
			</div>

			{imagePreview && (
				<div className='mt-4'>
					<img src={imagePreview} alt='Selected' className='w-full h-auto rounded-lg' />
				</div>
			)}

			<div className='flex justify-between items-center mt-2'>
				<div className='flex space-x-4'>
					<label className='flex items-center text-info hover:text-info-dark transition-colors duration-200 cursor-pointer'>
						<Image size={20} className='mr-1' />
						<span>Photo</span>
						<input
							type='file'
							accept='image/*'
							className='hidden'
							onChange={handleImageChange} />
					</label>
				</div>

				<button
					className='bg-primary text-white rounded-lg px-3 py-[6px] md:px-4 md:py-2 lg:px-4 lg:py-2 hover:bg-primary-dark transition-colors duration-200 cursor-pointer'
					onClick={handlePostCreation}
					disabled={isPending}
				>
					{isPending ? <Loader className='size-5 animate-spin' /> : "Share"}
				</button>
			</div>
		</div>
	);
};
export default PostCreation;
