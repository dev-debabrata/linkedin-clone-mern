import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    getSuggestedConnections,
    getPublicProfile,
    updateProfile,
    searchUsers,
    deleteProfilePicture,
    deleteBannerImage,
} from "../controllers/user.controller.js";

const router = express.Router();

// Protected GET routes
router.get("/search", protectRoute, searchUsers);
router.get("/suggestions", protectRoute, getSuggestedConnections);
router.get("/:username", protectRoute, getPublicProfile);

// Protected DELETE routes
router.delete("/profile-picture", protectRoute, deleteProfilePicture);
router.delete("/banner-image", protectRoute, deleteBannerImage);

// Protected PUT route
router.put("/profile", protectRoute, updateProfile);

export default router;
