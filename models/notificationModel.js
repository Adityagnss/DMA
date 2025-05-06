import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.ObjectId,
    ref: "users",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["order", "payment", "inquiry", "system"],
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  relatedId: {
    type: mongoose.ObjectId,
    refPath: "onModel",
  },
  onModel: {
    type: String,
    enum: ["Order", "Product", "Earnings"],
  },
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
