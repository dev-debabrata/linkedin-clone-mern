import { Link } from "react-router-dom";

const AuthCard = ({ title, children }) => (
	<div className='flex flex-col justify-center py-4 sm:px-6 lg:px-8 mt-16'>
		<div className='sm:mx-auto sm:w-full sm:max-w-md'>
			<img className='mx-auto w-[220px]' src='/linkedin-logo.png' alt='LinkedIn' />
			<h2 className='mt-5 text-center text-4xl font-bold text-gray-900'>{title}</h2>
		</div>
		<div className='mt-4 sm:mx-auto sm:w-full sm:max-w-md shadow-md'>
			<div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
				{children}
				<div className='mt-6 text-center'>
					<Link to='/login' className='text-sm font-semibold text-blue-600 hover:underline'>
						Back to login
					</Link>
				</div>
			</div>
		</div>
	</div>
);
export default AuthCard;
