import Navbar from "./Navbar";

const Layout = ({ children }) => {
	return (
		<div className='min-h-screen bg-base-100'>
			<Navbar />
			<main className='max-w-7xl lg:mx-auto px-4 py-4 pb-14 md:mx-4 md:px-4 md:py-6 lg:px-4 lg:py-6'>{children}</main>
		</div>
	);
};
export default Layout;
