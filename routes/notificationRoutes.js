import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import {
  registerDevice,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

// Register device token
router.post("/register-device", requireSignIn, registerDevice);

// Get user notifications
router.get("/user-notifications", requireSignIn, getUserNotifications);

// Mark notification as read
router.put("/mark-read/:notificationId", requireSignIn, markAsRead);

// Mark all notifications as read
router.put("/mark-all-read", requireSignIn, markAllAsRead);

export default router;
