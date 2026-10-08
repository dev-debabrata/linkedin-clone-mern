import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { axiosInstance } from "../../lib/axios";
import { isEmail, useForm } from "../../hooks/useForm";
import AuthCard from "../../components/auth/AuthCard";
import FormInput, { FormError } from "../../components/auth/FormInput";
import SubmitButton from "../../components/auth/SubmitButton";

const ForgotPasswordPage = () => {
	const { values, errors, bind, handleSubmit, setServerError } = useForm({ email: "" });

	const { mutate, isPending, isSuccess } = useMutation({
		mutationFn: () => axiosInstance.post("/auth/forgot-password", values),
		onError: setServerError,
	});

	return (
		<AuthCard title='Forgot password?'>
			{isSuccess ? (
				<div className='flex flex-col items-center gap-3 text-center'>
					<MailCheck className='size-12 text-blue-600' />
					<p className='text-gray-700'>
						If an account exists for <strong>{values.email}</strong>, we've sent a link to reset your
						password. The link expires in 15 minutes.
					</p>
					<FormError message={errors.form} />
				</div>
			) : (
				<form
					onSubmit={handleSubmit(
						({ email }) => ({ email: !isEmail(email) && "Please enter a valid email address" }),
						mutate
					)}
					noValidate
					className='space-y-4 w-full'
				>
					<p className='text-sm text-gray-600'>
						Enter the email linked to your account and we'll send you a reset link.
					</p>
					<FormInput type='email' placeholder='Email' autoComplete='email' {...bind("email")} />
					<SubmitButton isPending={isPending} pendingText='Sending...'>
						Send reset link
					</SubmitButton>
				</form>
			)}
		</AuthCard>
	);
};
export default ForgotPasswordPage;
