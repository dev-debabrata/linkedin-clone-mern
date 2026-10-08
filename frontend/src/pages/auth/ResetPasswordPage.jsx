import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import { newPasswordRules, useForm } from "../../hooks/useForm";
import AuthCard from "../../components/auth/AuthCard";
import FormInput, { FormError } from "../../components/auth/FormInput";
import SubmitButton from "../../components/auth/SubmitButton";

const ResetPasswordPage = () => {
	const { token } = useParams();
	const navigate = useNavigate();
	const { values, errors, bind, handleSubmit, setServerError } = useForm({ password: "", confirmPassword: "" });

	const { mutate, isPending } = useMutation({
		mutationFn: () => axiosInstance.post(`/auth/reset-password/${token}`, { password: values.password }),
		onSuccess: () => {
			toast.success("Password reset successfully. Please log in.");
			navigate("/login");
		},
		onError: setServerError,
	});

	return (
		<AuthCard title='Reset your password'>
			<form
				onSubmit={handleSubmit((v) => newPasswordRules(v.password, v.confirmPassword), mutate)}
				noValidate
				className='space-y-4 w-full'
			>
				<FormError message={errors.form} />
				<FormInput type='password' placeholder='New password (6+ characters)' autoComplete='new-password' {...bind("password")} />
				<FormInput type='password' placeholder='Confirm new password' autoComplete='new-password' {...bind("confirmPassword")} />
				<SubmitButton isPending={isPending} pendingText='Resetting...'>
					Reset password
				</SubmitButton>
			</form>
		</AuthCard>
	);
};
export default ResetPasswordPage;
