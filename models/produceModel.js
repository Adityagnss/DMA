import mongoose from "mongoose";

const produceSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    photo: {
      data: Buffer,
      contentType: String,
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'negotiating'],
      default: 'available'
    }
  },
  { timestamps: true }
);

export default mongoose.model("produce", produceSchema);
