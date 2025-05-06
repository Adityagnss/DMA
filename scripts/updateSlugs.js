import mongoose from "mongoose";
import slugify from "slugify";
import dotenv from "dotenv";
import produceModel from "../models/produceModel.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const updateSlugs = async () => {
  try {
    console.log("Starting to update slugs for all products...");
    
    // Get all products without a slug
    const products = await produceModel.find({
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: "" }
      ]
    });
    
    console.log(`Found ${products.length} products without slugs`);
    
    let updatedCount = 0;
    
    // Update each product with a slug based on its name
    for (const product of products) {
      const slug = slugify(product.name, { lower: true });
      
      // Check if the slug already exists to avoid duplicates
      const existingWithSlug = await produceModel.findOne({ slug });
      
      // If duplicate, add a unique identifier
      const finalSlug = existingWithSlug && existingWithSlug._id.toString() !== product._id.toString() 
        ? `${slug}-${product._id.toString().slice(-4)}` 
        : slug;
      
      // Update the product
      await produceModel.findByIdAndUpdate(product._id, { slug: finalSlug });
      updatedCount++;
      
      console.log(`Updated "${product.name}" with slug "${finalSlug}"`);
    }
    
    console.log(`Successfully updated ${updatedCount} products with slugs`);
  } catch (error) {
    console.error("Error updating slugs:", error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the script
updateSlugs();
