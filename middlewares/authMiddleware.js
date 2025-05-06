import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

//Protected Routes token base
export const requireSignIn = async (req, res, next) => {
  try {
    const decode = JWT.verify(
      req.headers.authorization,
      process.env.JWT_SECRET
    );
    req.user = decode;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).send({
      success: false,
      message: "Unauthorized Access",
    });
  }
};

//admin access
export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (user.role !== 1) {
      return res.status(401).send({
        success: false,
        message: "UnAuthorized Access",
      });
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(401).send({
      success: false,
      message: "Error in admin middleware",
    });
  }
};

// Farmer access
export const isFarmer = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (user.userType !== 'farmer') {
      return res.status(401).send({
        success: false,
        message: "Unauthorized Access - Farmers Only",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(401).send({
      success: false,
      message: "Error in farmer middleware",
    });
  }
};

// Buyer access
export const isBuyer = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (user.userType !== 'buyer') {
      return res.status(401).send({
        success: false,
        message: "Unauthorized Access - Buyers Only",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(401).send({
      success: false,
      message: "Error in buyer middleware",
    });
  }
};
