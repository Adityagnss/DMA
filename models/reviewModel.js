import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'orders',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("reviews", reviewSchema);
