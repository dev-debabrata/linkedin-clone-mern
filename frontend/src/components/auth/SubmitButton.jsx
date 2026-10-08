import { Loader } from "lucide-react";

const SubmitButton = ({ isPending, pendingText, children }) => (
	<button
		type='submit'
		disabled={isPending}
		className='btn btn-primary w-full cursor-pointer border rounded-md p-2 bg-primary text-white hover:bg-primary-dark font-semibold flex justify-center items-center gap-2'
		>
		{isPending ? (
			<>
				<Loader className='size-5 animate-spin' />
				<span>{pendingText}</span>
			</>
		) : (
			children
		)}
	</button>
);
export default SubmitButton;
