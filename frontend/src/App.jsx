import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import SignUpPage from "./pages/auth/SignUpPage";
import toast, { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "./lib/axios";
import NotificationsPage from "./pages/NotificationsPage";
import NetworkPage from "./pages/NetworkPage";
import PostSharePage from "./pages/PostSharePage";
import ProfilePage from "./pages/ProfilePage";
import SuggestionsPage from "./pages/SuggestionsPage";
import PostCreateMobile from "./pages/PostCreateMobile";


function App() {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        return res.data;
      } catch (err) {
        if (err.response?.status === 401) {
          console.log("Auth Check: 401 Unauthorized - User is not logged in.");
          return null;
        }
        toast.error(err.response?.data?.message || "Something went wrong");
        return null;
      }
    },
    retry: false,
  });

  if (isLoading) return null;

  return (
    <Layout>
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to={"/login"} />} />
        <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
        <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
        <Route path="/create-post" element={authUser ? <PostCreateMobile /> : <Navigate to={"/login"} />} />
        <Route path='/notifications' element={authUser ? <NotificationsPage /> : <Navigate to={"/login"} />} />
        <Route path='/network' element={authUser ? <NetworkPage /> : <Navigate to={"/login"} />} />
        <Route path='/post/:postId' element={authUser ? <PostSharePage /> : <Navigate to={"/login"} />} />
        <Route path="/posts/:postId" element={authUser ? <PostSharePage /> : <Navigate to={"/login"} />} />
        <Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to={"/login"} />} />
        <Route path="/suggestions" element={authUser ? <SuggestionsPage /> : <Navigate to={"/login"} />} />
      </Routes>
      <Toaster />
    </Layout>
  );
}

export default App;
