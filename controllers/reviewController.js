import reviewModel from "../models/reviewModel.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

// Create a new review
export const createReviewController = async (req, res) => {
  try {
    const { farmerId, orderId, rating, comment } = req.body;
    
    // Validate required fields
    if (!farmerId || !orderId || !rating || !comment) {
      return res.status(400).send({
        success: false,
        message: "All fields are required",
      });
    }
    
    // Check if the order exists and belongs to the reviewer
    const order = await orderModel.findOne({ 
      _id: orderId,
      buyer: req.user._id
    });
    
    if (!order) {
      return res.status(404).send({
        success: false,
        message: "Order not found or you are not authorized to review this order",
      });
    }
    
    // Check if the farmer exists
    const farmerExists = await userModel.findOne({ 
      _id: farmerId,
      userType: "farmer" 
    });
    
    if (!farmerExists) {
      return res.status(404).send({
        success: false,
        message: "Farmer not found",
      });
    }
    
    // Check if the user has already reviewed this order
    const existingReview = await reviewModel.findOne({
      reviewer: req.user._id,
      order: orderId
    });
    
    if (existingReview) {
      return res.status(400).send({
        success: false,
        message: "You have already reviewed this order",
      });
    }
    
    // Create the review
    const review = new reviewModel({
      reviewer: req.user._id,
      farmer: farmerId,
      order: orderId,
      rating: rating,
      comment: comment
    });
    
    await review.save();
    
    res.status(201).send({
      success: true,
      message: "Review submitted successfully",
      review,
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in submitting review",
      error,
    });
  }
};

// Get reviews by farmer ID
export const getFarmerReviewsController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reviews = await reviewModel.find({ farmer: id })
      .populate("reviewer", "name")
      .sort({ createdAt: -1 });
      
    res.status(200).send({
      success: true,
      reviews,
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in fetching reviews",
      error,
    });
  }
};

// Get reviews by reviewer (buyer) ID
export const getUserReviewsController = async (req, res) => {
  try {
    const reviews = await reviewModel.find({ reviewer: req.user._id })
      .populate("farmer", "name")
      .populate("order")
      .sort({ createdAt: -1 });
      
    res.status(200).send({
      success: true,
      reviews,
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in fetching reviews",
      error,
    });
  }
};

// Update a review
export const updateReviewController = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    // Find the review and check if it belongs to the user
    const review = await reviewModel.findOne({
      _id: id,
      reviewer: req.user._id
    });
    
    if (!review) {
      return res.status(404).send({
        success: false,
        message: "Review not found or you are not authorized to update it",
      });
    }
    
    // Update the review
    review.rating = rating;
    review.comment = comment;
    
    await review.save();
    
    res.status(200).send({
      success: true,
      message: "Review updated successfully",
      review,
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in updating review",
      error,
    });
  }
};

// Delete a review
export const deleteReviewController = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the review and check if it belongs to the user
    const review = await reviewModel.findOne({
      _id: id,
      reviewer: req.user._id
    });
    
    if (!review) {
      return res.status(404).send({
        success: false,
        message: "Review not found or you are not authorized to delete it",
      });
    }
    
    await reviewModel.findByIdAndDelete(id);
    
    res.status(200).send({
      success: true,
      message: "Review deleted successfully",
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in deleting review",
      error,
    });
  }
};
