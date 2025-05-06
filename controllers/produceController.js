import produceModel from "../models/produceModel.js";
import fs from "fs";
import slugify from "slugify";
import mongoose from "mongoose";

// Create produce listing
export const createProduceController = async (req, res) => {
  try {
    const { name, description, price, quantity, unit, category } = req.fields;
    const { photo } = req.files;

    // Validation
    if (!name || !description || !price || !quantity || !unit || !category) {
      return res.status(400).send({ message: "All fields are required" });
    }
    if (photo && photo.size > 1000000) {
      return res.status(400).send({ message: "Photo should be less than 1mb" });
    }

    const produce = new produceModel({
      name,
      slug: slugify(name, { lower: true }),
      description,
      price,
      quantity,
      unit,
      category,
      farmer: req.user._id,
    });

    if (photo) {
      produce.photo.data = fs.readFileSync(photo.path);
      produce.photo.contentType = photo.type;
    }

    await produce.save();
    res.status(201).send({
      success: true,
      message: "Produce listed successfully",
      produce,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in creating produce listing",
      error,
    });
  }
};

// Get all produce listings
export const getProduceController = async (req, res) => {
  try {
    const produce = await produceModel
      .find({})
      .populate("farmer", "name email phone")
      .select("-photo")
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      total: produce.length,
      message: "All Produce",
      produce,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting produce listings",
      error,
    });
  }
};

// Get single produce
export const getSingleProduceController = async (req, res) => {
  try {
    const pid = req.params.pid;
    let produce;
    
    // First try to find by slug
    produce = await produceModel
      .findOne({ slug: pid })
      .populate("farmer", "name email phone")
      .select("-photo");
    
    // If not found by slug, try to find by ID (for backward compatibility)
    if (!produce && mongoose.Types.ObjectId.isValid(pid)) {
      produce = await produceModel
        .findById(pid)
        .populate("farmer", "name email phone")
        .select("-photo");
    }
    
    // If no produce found with either method
    if (!produce) {
      return res.status(404).send({
        success: false,
        message: "Produce not found",
      });
    }
    
    res.status(200).send({
      success: true,
      message: "Single Produce Fetched",
      produce,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single produce",
      error,
    });
  }
};

// Get single produce by ID
export const getSingleProduceByIdController = async (req, res) => {
  try {
    const produce = await produceModel
      .findById(req.params.id)
      .populate("farmer", "name email phone")
      .select("-photo");
    
    if (!produce) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }
    
    res.status(200).send({
      success: true,
      message: "Product fetched successfully",
      produce,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting product by ID",
      error,
    });
  }
};

// Get produce photo
export const producePhotoController = async (req, res) => {
  try {
    const pid = req.params.pid;
    let produce;
    
    // First try to find by slug
    produce = await produceModel.findOne({ slug: pid }).select("photo");
    
    // If not found by slug, try to find by ID (for backward compatibility)
    if (!produce && mongoose.Types.ObjectId.isValid(pid)) {
      produce = await produceModel.findById(pid).select("photo");
    }
    
    // If no produce found or no photo available
    if (!produce || !produce.photo.data) {
      return res.status(404).send({
        success: false,
        message: "Photo not found"
      });
    }
    
    res.set("Content-type", produce.photo.contentType);
    return res.status(200).send(produce.photo.data);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error,
    });
  }
};

// Delete produce
export const deleteProduceController = async (req, res) => {
  try {
    const produce = await produceModel.findById(req.params.pid).select("-photo");
    if (!produce) {
      return res.status(404).send({ message: "Produce not found" });
    }
    
    // Check if the user is the farmer who created the listing
    if (produce.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: "Unauthorized access" });
    }
    
    await produceModel.findByIdAndDelete(req.params.pid);
    res.status(200).send({
      success: true,
      message: "Produce Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting produce",
      error,
    });
  }
};

// Update produce
export const updateProduceController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, quantity, unit, category } = req.fields;
    const { photo } = req.files;

    // Validation
    if (!name || !description || !price || !quantity || !unit || !category) {
      return res.status(400).send({ message: "All fields are required" });
    }

    const produce = await produceModel.findById(id);
    if (!produce) {
      return res.status(404).send({ message: "Produce not found" });
    }

    // Check if the user is the farmer who created the produce
    if (produce.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: "Unauthorized access" });
    }

    const updates = { 
      name,
      slug: slugify(name, { lower: true }),
      description,
      price,
      quantity,
      unit,
      category,
    };
    
    if (photo) {
      if (photo.size > 1000000) {
        return res.status(400).send({ message: "Photo should be less than 1mb" });
      }
      updates.photo = {
        data: fs.readFileSync(photo.path),
        contentType: photo.type,
      };
    }

    const updatedProduce = await produceModel.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    res.status(200).send({
      success: true,
      message: "Produce updated successfully",
      updatedProduce,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in updating produce",
      error,
    });
  }
};

// Get farmer's produce listings
export const getFarmerProduceController = async (req, res) => {
  try {
    const produce = await produceModel
      .find({ farmer: req.user._id })
      .select("-photo")
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      total: produce.length,
      message: "Farmer's Produce Listings",
      produce,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting farmer's produce",
      error,
    });
  }
};

// Filter produce
export const filterProduceController = async (req, res) => {
  try {
    const { radio } = req.body;
    let args = {};

    // Price filter
    if (radio.length) {
      args.price = { $gte: radio[0], $lte: radio[1] };
    }

    const produce = await produceModel
      .find(args)
      .populate("farmer", "name email phone")
      .select("-photo")
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      produce,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while filtering produce",
      error,
    });
  }
};

// Update product stock
export const updateStockController = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    // Validate quantity
    if (quantity < 0) {
      return res.status(400).send({
        success: false,
        message: "Quantity cannot be negative"
      });
    }
    
    const produce = await produceModel.findById(id);
    if (!produce) {
      return res.status(404).send({
        success: false,
        message: "Produce not found"
      });
    }
    
    // Update quantity
    produce.quantity = quantity;
    
    // Update status based on quantity
    if (quantity <= 0) {
      produce.status = 'sold';
    } else {
      produce.status = 'available';
    }
    
    await produce.save();
    
    res.status(200).send({
      success: true,
      message: "Stock updated successfully",
      produce
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error updating stock",
      error
    });
  }
};
