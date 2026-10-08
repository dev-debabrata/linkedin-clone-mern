import { useState } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";

// Text/password input with an inline error; password inputs get a show/hide toggle
const FormInput = ({ type = "text", error, ...props }) => {
	const [showPassword, setShowPassword] = useState(false);
	const isPassword = type === "password";

	return (
		<div>
			<div className='relative'>
				<input
					type={isPassword && showPassword ? "text" : type}
					aria-invalid={!!error}
					className={`input input-bordered w-full p-2 border rounded-md focus:outline-none ${isPassword ? "pr-10" : ""} ${
						error ? "border-red-500" : "border-blue-300 hover:border-blue-500 focus:border-red-600"
					}`}
					{...props}
				/>
				{isPassword && (
					<button
						type='button'
						onClick={() => setShowPassword((prev) => !prev)}
						className='absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 cursor-pointer'
						aria-label={showPassword ? "Hide password" : "Show password"}
					>
						{showPassword ? <EyeOff className='size-5' /> : <Eye className='size-5' />}
					</button>
				)}
			</div>
			<FieldError message={error} />
		</div>
	);
};

export const FieldError = ({ message }) =>
	message ? <p className='mt-1 text-sm text-red-600'>{message}</p> : null;

// Form-level error shown as an alert at the top of the form
export const FormError = ({ message }) =>
	message ? (
		<div role='alert' className='flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
			<CircleAlert className='size-4 shrink-0' />
			{message}
		</div>
	) : null;

export default FormInput;
