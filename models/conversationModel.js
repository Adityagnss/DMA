import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    }],
    lastMessage: {
      type: String,
      default: "",
    },
    // Update unread counts to track per user
    unreadCounts: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.model("conversations", conversationSchema);
