import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import { 
  createMessageController, 
  getMessagesController,
  getConversationsController,
  getUnreadCountController,
  markMessagesAsReadController
} from "../controllers/messageController.js";

const router = express.Router();

// Create a new message
router.post("/send", requireSignIn, createMessageController);

// Get messages between two users
router.get("/conversation/:userId", requireSignIn, getMessagesController);

// Get all conversations for a user
router.get("/conversations", requireSignIn, getConversationsController);

// Get total unread message count
router.get("/unread-count", requireSignIn, getUnreadCountController);

// Mark messages as read in a conversation
router.post("/mark-read", requireSignIn, markMessagesAsReadController);

export default router;
