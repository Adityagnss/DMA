import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.ObjectId,
    ref: "users",
    required: true,
  },
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
  },
  reference: {
    type: String,
    unique: true,
  },
}, { timestamps: true });

const earningsSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.ObjectId,
    ref: "users",
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  transactions: [transactionSchema],
  escrowBalance: {
    type: Number,
    default: 0,
  },
  deviceToken: String,
}, { timestamps: true });

export default mongoose.model("Earnings", earningsSchema);
