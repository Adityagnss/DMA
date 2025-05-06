import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "produce",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    // Reservations expire after a set time (e.g., 24 hours)
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Index for efficient queries and expiration
reservationSchema.index({ product: 1, status: 1 });
reservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("reservation", reservationSchema);
