import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../../lib/axios.js";
import { isEmail, newPasswordRules, useForm } from "../../hooks/useForm";
import FormInput, { FormError } from "./FormInput";
import SubmitButton from "./SubmitButton";

const SignUpForm = () => {
	const queryClient = useQueryClient();
	const { values, errors, bind, handleSubmit, setServerError } = useForm({
		name: "",
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});

	const { mutate, isPending } = useMutation({
		mutationFn: () => {
			const { name, username, email, password } = values;
			return axiosInstance.post("/auth/signup", { name, username, email, password });
		},
		onSuccess: () => {
			toast.success("Account created successfully");
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
		onError: setServerError,
	});

	return (
		<form
			onSubmit={handleSubmit(
				({ name, username, email, password, confirmPassword }) => ({
					name: !name.trim() && "Please enter your full name",
					username: !username.trim() && "Please choose a username",
					email: !isEmail(email) && "Please enter a valid email address",
					...newPasswordRules(password, confirmPassword),
				}),
				mutate
			)}
			noValidate
			className='flex flex-col gap-4'
		>
			<FormError message={errors.form} />
			<FormInput placeholder='Full name' autoComplete='name' {...bind("name")} />
			<FormInput placeholder='Username' autoComplete='off' {...bind("username")} />
			<FormInput type='email' placeholder='Email' autoComplete='email' {...bind("email")} />
			<FormInput type='password' placeholder='Password (6+ characters)' autoComplete='new-password' {...bind("password")} />
			<FormInput type='password' placeholder='Confirm password' autoComplete='new-password' {...bind("confirmPassword")} />
			<SubmitButton isPending={isPending} pendingText='Signing Up...'>
				Agree & Join
			</SubmitButton>
		</form>
	);
};
export default SignUpForm;
