import reservationModel from "../models/reservationModel.js";
import produceModel from "../models/produceModel.js";
import mongoose from "mongoose";

// Create a new reservation when adding items to cart
export const createReservationController = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).send({
        success: false,
        message: "Product ID and valid quantity are required",
      });
    }

    // Check current product stock
    const product = await produceModel.findById(productId);
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Get total existing reservations for this product (except user's own)
    const existingReservations = await reservationModel.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          user: { $ne: new mongoose.Types.ObjectId(userId) },
          status: "active",
        },
      },
      {
        $group: {
          _id: null,
          totalReserved: { $sum: "$quantity" },
        },
      },
    ]);

    const totalReserved = existingReservations[0]?.totalReserved || 0;
    const availableStock = product.quantity - totalReserved;

    // Check if user already has a reservation for this product
    const existingUserReservation = await reservationModel.findOne({
      product: productId,
      user: userId,
      status: "active",
    });

    const userCurrentReservation = existingUserReservation?.quantity || 0;

    // Check if requested quantity is available
    if (quantity > (availableStock + userCurrentReservation)) {
      return res.status(400).send({
        success: false,
        message: `Only ${availableStock + userCurrentReservation} units available`,
        availableStock: availableStock + userCurrentReservation,
      });
    }

    // Update or create reservation
    let reservation;
    if (existingUserReservation) {
      existingUserReservation.quantity = quantity;
      existingUserReservation.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Reset expiration
      reservation = await existingUserReservation.save();
    } else {
      reservation = await new reservationModel({
        user: userId,
        product: productId,
        quantity,
      }).save();
    }

    res.status(201).send({
      success: true,
      message: "Stock reserved successfully",
      reservation,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in reserving stock",
      error,
    });
  }
};

// Get available stock for a product (considering reservations)
export const getAvailableStockController = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?._id;

    // Check if product exists
    const product = await produceModel.findById(productId);
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Calculate total reserved quantity by other users
    const query = {
      product: new mongoose.Types.ObjectId(productId),
      status: "active",
    };
    
    // If user is logged in, exclude their own reservations from the count
    if (userId) {
      query.user = { $ne: new mongoose.Types.ObjectId(userId) };
    }

    const reservations = await reservationModel.aggregate([
      { $match: query },
      { $group: {
          _id: null,
          totalReserved: { $sum: "$quantity" }
        }
      }
    ]);

    const totalReserved = reservations[0]?.totalReserved || 0;
    const availableStock = Math.max(0, product.quantity - totalReserved);

    // Get user's current reservation if logged in
    let userReservation = null;
    if (userId) {
      userReservation = await reservationModel.findOne({
        product: productId,
        user: userId,
        status: "active",
      });
    }

    res.status(200).send({
      success: true,
      totalStock: product.quantity,
      availableStock,
      userReservation: userReservation ? userReservation.quantity : 0,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting available stock",
      error,
    });
  }
};

// Cancel reservation when removing from cart
export const cancelReservationController = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const result = await reservationModel.findOneAndUpdate(
      {
        product: productId,
        user: userId,
        status: "active",
      },
      {
        status: "cancelled",
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).send({
        success: false,
        message: "No active reservation found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Reservation cancelled successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in cancelling reservation",
      error,
    });
  }
};

// Update reservation quantity
export const updateReservationController = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    if (!quantity || quantity <= 0) {
      return res.status(400).send({
        success: false,
        message: "Valid quantity is required",
      });
    }

    // Check product stock
    const product = await produceModel.findById(productId);
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Get total existing reservations by other users
    const existingReservations = await reservationModel.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
          user: { $ne: new mongoose.Types.ObjectId(userId) },
          status: "active",
        },
      },
      {
        $group: {
          _id: null,
          totalReserved: { $sum: "$quantity" },
        },
      },
    ]);

    const totalReserved = existingReservations[0]?.totalReserved || 0;
    const availableStock = product.quantity - totalReserved;

    // Get user's current reservation
    const userReservation = await reservationModel.findOne({
      product: productId,
      user: userId,
      status: "active",
    });

    const userCurrentReservation = userReservation?.quantity || 0;

    // Check if requested quantity is available
    if (quantity > (availableStock + userCurrentReservation)) {
      return res.status(400).send({
        success: false,
        message: `Only ${availableStock + userCurrentReservation} units available`,
        availableStock: availableStock + userCurrentReservation,
      });
    }

    // Update reservation
    const updatedReservation = await reservationModel.findOneAndUpdate(
      {
        product: productId,
        user: userId,
        status: "active",
      },
      {
        quantity,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Reset expiration
      },
      { new: true, upsert: true }
    );

    res.status(200).send({
      success: true,
      message: "Reservation updated successfully",
      reservation: updatedReservation,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in updating reservation",
      error,
    });
  }
};

// Clean up expired reservations (can be called by a cron job)
export const cleanupExpiredReservationsController = async (req, res) => {
  try {
    const result = await reservationModel.updateMany(
      {
        expiresAt: { $lt: new Date() },
        status: "active",
      },
      {
        status: "expired",
      }
    );

    res.status(200).send({
      success: true,
      message: `${result.modifiedCount} expired reservations cleaned up`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in cleaning up reservations",
      error,
    });
  }
};
