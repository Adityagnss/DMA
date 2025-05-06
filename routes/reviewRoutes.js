import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import {
  createReviewController,
  getFarmerReviewsController,
  getUserReviewsController,
  updateReviewController,
  deleteReviewController
} from "../controllers/reviewController.js";

const router = express.Router();

// Create a review
router.post("/create", requireSignIn, createReviewController);

// Get reviews by farmer ID
router.get("/farmer/:id", getFarmerReviewsController);

// Get reviews by user ID (authenticated user's reviews)
router.get("/user", requireSignIn, getUserReviewsController);

// Update a review
router.put("/update/:id", requireSignIn, updateReviewController);

// Delete a review
router.delete("/delete/:id", requireSignIn, deleteReviewController);

export default router;
