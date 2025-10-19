import { Link } from "react-router-dom";
import SignUpForm from "../../components/auth/SignUpForm";
import Footer from "../../components/layout/Footer";

const SignUpPage = () => {
	return (
		<>
			<div className='max-h-screen flex flex-col justify-center py-4 sm:px-6 lg:px-8 mt-8 md:mt-auto'>
				<div className='sm:mx-auto sm:w-full sm:max-w-md'>
					<img className='mx-auto w-[220px]' src='/linkedin-logo.png' alt='LinkedIn' />
					<h2 className='mt-5 text-center text-4xl font-bold text-gray-900'>
						Make the most of your professional life
					</h2>
				</div>
				<div className='mt-4 sm:mx-auto sm:w-full sm:max-w-md shadow-md'>
					<div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
						<SignUpForm />

						<div className='mt-6'>
							<div className='relative'>
								<div className='absolute inset-0 flex items-center'>
									<div className='w-full border-t border-gray-300'></div>
								</div>
								<div className='relative flex justify-center text-sm'>
									<span className='px-2 bg-white text-gray-500'>Already on LinkedIn?</span>
								</div>
							</div>
							<div className='mt-6'>
								<Link
									to='/login'
									className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-blue-600 bg-gray-100 hover:bg-blue-50'
								>
									Sign in
								</Link>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className=" mt-12">
				<Footer />
			</div>
		</>
	);
};
export default SignUpPage;
