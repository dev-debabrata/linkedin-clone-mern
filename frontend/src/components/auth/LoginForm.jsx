import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { axiosInstance } from "../../lib/axios";
import { useForm } from "../../hooks/useForm";
import FormInput, { FormError } from "./FormInput";
import SubmitButton from "./SubmitButton";

const LoginForm = () => {
	const queryClient = useQueryClient();
	const { values, errors, bind, handleSubmit, setServerError } = useForm({ identifier: "", password: "" });

	const { mutate, isPending } = useMutation({
		mutationFn: () => axiosInstance.post("/auth/login", values),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
		onError: setServerError,
	});

	return (
		<form
			onSubmit={handleSubmit(
				({ identifier, password }) => ({
					identifier: !identifier.trim() && "Please enter your email or username",
					password: !password && "Please enter your password",
				}),
				mutate
			)}
			noValidate
			className='space-y-4 w-full max-w-md'
		>
			<FormError message={errors.form} />
			<FormInput placeholder='Email or username' autoComplete='username' {...bind("identifier")} />
			<FormInput type='password' placeholder='Password' autoComplete='current-password' {...bind("password")} />
			<div className='flex justify-end'>
				<Link to='/forgot-password' className='text-sm font-semibold text-blue-600 hover:underline'>
					Forgot password?
				</Link>
			</div>
			<SubmitButton isPending={isPending} pendingText='Logging in...'>
				Login
			</SubmitButton>
		</form>
	);
};
export default LoginForm;
