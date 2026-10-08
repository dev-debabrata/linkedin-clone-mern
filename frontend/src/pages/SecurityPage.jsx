import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import Sidebar from "../components/Sidebar";
import { newPasswordRules, useForm } from "../hooks/useForm";
import FormInput, { FormError } from "../components/auth/FormInput";
import SubmitButton from "../components/auth/SubmitButton";

const formatDate = (date) =>
	date ? new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Never";

const SecurityPage = () => {
	const queryClient = useQueryClient();
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const { values, errors, bind, handleSubmit, setServerError, reset } = useForm({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const { mutate, isPending } = useMutation({
		mutationFn: () =>
			axiosInstance.put("/auth/change-password", {
				currentPassword: values.currentPassword,
				newPassword: values.newPassword,
			}),
		onSuccess: () => {
			toast.success("Password changed. Other devices have been signed out.");
			reset();
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
		},
		onError: setServerError,
	});

	const accountDetails = [
		["Email", authUser?.email],
		["Username", authUser?.username],
		["Member since", formatDate(authUser?.createdAt)],
		["Password last changed", formatDate(authUser?.passwordChangedAt)],
		["Connections", authUser?.connections?.length ?? 0],
	];

	return (
		<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
			<div className='col-span-1 lg:col-span-1 hidden lg:block sticky top-[78px] h-[calc(100vh-110px)] overflow-y-auto'>
				<Sidebar user={authUser} />
			</div>
			<div className='col-span-1 lg:col-span-3 space-y-6'>
				<div className='bg-white rounded-lg shadow p-6'>
					<div className='flex items-center justify-between mb-4'>
						<h1 className='text-2xl font-bold'>Account status</h1>
						<span className='flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full'>
							<ShieldCheck size={16} />
							Active
						</span>
					</div>
					<dl className='divide-y divide-gray-200'>
						{accountDetails.map(([label, value]) => (
							<div key={label} className='flex justify-between py-3 text-sm'>
								<dt className='text-gray-500'>{label}</dt>
								<dd className='font-medium text-gray-900'>{value}</dd>
							</div>
						))}
					</dl>
				</div>

				<div className='bg-white rounded-lg shadow p-6'>
					<h2 className='text-2xl font-bold mb-1'>Change password</h2>
					<p className='text-sm text-gray-600 mb-4'>
						Changing your password signs you out on all other devices.
					</p>
					<form
						onSubmit={handleSubmit(
							(v) => ({
								currentPassword: !v.currentPassword && "Please enter your current password",
								...newPasswordRules(v.newPassword, v.confirmPassword, "newPassword"),
							}),
							mutate
						)}
						noValidate
						className='space-y-4 max-w-md'
					>
						<FormError message={errors.form} />
						<FormInput type='password' placeholder='Current password' autoComplete='current-password' {...bind("currentPassword")} />
						<FormInput type='password' placeholder='New password (6+ characters)' autoComplete='new-password' {...bind("newPassword")} />
						<FormInput type='password' placeholder='Confirm new password' autoComplete='new-password' {...bind("confirmPassword")} />
						<SubmitButton isPending={isPending} pendingText='Saving...'>
							Change password
						</SubmitButton>
					</form>
				</div>
			</div>
		</div>
	);
};
export default SecurityPage;
