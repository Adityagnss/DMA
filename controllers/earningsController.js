import earningsModel from "../models/earningsModel.js";
import notificationModel from "../models/notificationModel.js";
import { sendNotification } from "../services/firebaseService.js";
import crypto from "crypto";

// Get farmer earnings
export const getFarmerEarnings = async (req, res) => {
  try {
    let earnings = await earningsModel.findOne({ farmer: req.user._id });
    
    if (!earnings) {
      earnings = new earningsModel({
        farmer: req.user._id,
        balance: 0,
        escrowBalance: 0,
      });
      await earnings.save();
    }

    // Get recent transactions
    const recentTransactions = earnings.transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    res.json({
      success: true,
      balance: earnings.balance,
      escrowBalance: earnings.escrowBalance,
      transactions: recentTransactions,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error getting earnings",
      error,
    });
  }
};

// Process withdrawal
export const processWithdrawal = async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).send({
        success: false,
        message: "Invalid withdrawal amount",
      });
    }

    if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
      return res.status(400).send({
        success: false,
        message: "Bank details are required",
      });
    }

    const earnings = await earningsModel.findOne({ farmer: req.user._id });
    if (!earnings || earnings.balance < amount) {
      return res.status(400).send({
        success: false,
        message: "Insufficient balance",
      });
    }

    // Generate unique reference number
    const reference = crypto.randomBytes(8).toString("hex");

    // Create withdrawal transaction
    earnings.transactions.push({
      type: "debit",
      amount,
      description: "Withdrawal to bank account",
      status: "pending",
      bankDetails,
      reference,
    });

    // Update balance
    earnings.balance -= amount;
    await earnings.save();

    // Create notification
    const notification = new notificationModel({
      user: req.user._id,
      title: "Withdrawal Initiated",
      message: `Your withdrawal request for ₹${amount} has been initiated. Reference: ${reference}`,
      type: "payment",
      relatedId: earnings._id,
      onModel: "Earnings",
    });
    await notification.save();

    // Send push notification
    if (earnings.deviceToken) {
      await sendNotification(earnings.deviceToken, notification.title, notification.message);
    }

    res.json({
      success: true,
      message: "Withdrawal request processed successfully",
      reference,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error processing withdrawal",
      error,
    });
  }
};
