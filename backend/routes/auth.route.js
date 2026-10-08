import express from "express";
import {
	login,
	logout,
	signup,
	getCurrentUser,
	forgotPassword,
	resetPassword,
	changePassword,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get("/me", getCurrentUser);
router.put("/change-password", protectRoute, changePassword);

export default router;
