import axios from "axios";

export const axiosInstance = axios.create({
	baseURL: import.meta.env.VITE_BACKEND_URL + "/api/v1",
	withCredentials: true,
});


// export const axiosInstance = axios.create({
// 	baseURL: import.meta.env.MODE === "development"
// 		? "http://localhost:5000/api/v1"
// 		: "/api/v1",
// 	withCredentials: true,
// });
