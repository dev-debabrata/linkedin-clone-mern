import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getSuggestedConnections, getPublicProfile, updateProfile, searchUsers } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers); // Add the new search route
router.get("/:username", protectRoute, getPublicProfile);
router.get("/suggestions", protectRoute, getSuggestedConnections);

router.put("/profile", protectRoute, updateProfile);

export default router;
