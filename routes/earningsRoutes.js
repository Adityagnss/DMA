import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import { getFarmerEarnings, processWithdrawal } from "../controllers/earningsController.js";

const router = express.Router();

// Get farmer earnings
router.get("/farmer-earnings", requireSignIn, getFarmerEarnings);

// Process withdrawal
router.post("/withdraw", requireSignIn, processWithdrawal);

export default router;
