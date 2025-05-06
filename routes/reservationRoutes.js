import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import {
  createReservationController,
  getAvailableStockController,
  cancelReservationController,
  updateReservationController,
  cleanupExpiredReservationsController
} from "../controllers/reservationController.js";

const router = express.Router();

// Create a new reservation
router.post("/create", requireSignIn, createReservationController);

// Get available stock for a product (considering active reservations)
router.get("/available-stock/:productId", getAvailableStockController);

// Cancel a reservation when removing from cart
router.delete("/cancel/:productId", requireSignIn, cancelReservationController);

// Update reservation quantity
router.put("/update/:productId", requireSignIn, updateReservationController);

// Clean up expired reservations (can be scheduled as a cron job)
router.post("/cleanup-expired", cleanupExpiredReservationsController);

export default router;
