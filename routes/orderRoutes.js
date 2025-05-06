import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import { getFarmerOrders, updateOrderStatus, getFarmerSalesHistory } from "../controllers/orderController.js";

const router = express.Router();

// Get farmer orders
router.get("/farmer-orders", requireSignIn, getFarmerOrders);

// Update order status
router.put("/update-status/:orderId", requireSignIn, updateOrderStatus);

// Get farmer sales history
router.get("/farmer-sales/:id", getFarmerSalesHistory);

export default router;
