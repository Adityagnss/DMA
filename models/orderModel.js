import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    produce: {
      type: mongoose.ObjectId,
      ref: "produce",
      required: true
    },
    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
      required: true
    },
    farmer: {
      type: mongoose.ObjectId,
      ref: "users",
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    negotiation: {
      currentPrice: {
        type: Number,
        required: true
      },
      buyerProposedPrice: Number,
      farmerCounterPrice: Number,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'countered'],
        default: 'pending'
      }
    },
    payment: {
      status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
      },
      amount: Number,
      method: String,
      transactionId: String
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
