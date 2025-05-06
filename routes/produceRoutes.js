import express from "express";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import {
  createProduceController,
  deleteProduceController,
  getFarmerProduceController,
  getProduceController,
  getSingleProduceController,
  getSingleProduceByIdController,
  producePhotoController,
  updateProduceController,
  filterProduceController,
  updateStockController,
} from "../controllers/produceController.js";
import formidable from "express-formidable";

const router = express.Router();

// Routes
router.post(
  "/create-produce",
  requireSignIn,
  formidable(),
  createProduceController
);
router.put(
  "/update-produce/:pid",
  requireSignIn,
  formidable(),
  updateProduceController
);
router.put(
  "/update-stock/:id",
  updateStockController
);
router.get("/get-produce", getProduceController);
router.get("/get-produce/:pid", getSingleProduceController);
router.get("/get-produce-by-id/:id", getSingleProduceByIdController);
router.get("/produce-photo/:pid", producePhotoController);
router.delete("/delete-produce/:pid", requireSignIn, deleteProduceController);
router.get("/farmer-produce", requireSignIn, getFarmerProduceController);
router.post("/filter-produce", filterProduceController);

export default router;
