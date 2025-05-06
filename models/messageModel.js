import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversations",
      required: true,
    }
  },
  { timestamps: true }
);

export default mongoose.model("messages", messageSchema);
