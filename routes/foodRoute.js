import express from "express";
import { addFood, listFood, removeFood } from "../controllers/foodController.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// Cloudinary Configuration (ensure this is correct in cloudinary.js)
cloudinary.config({
  cloud_name: 'dq2cz6okc', // Replace with your Cloudinary cloud name
  api_key: '779873725442766', // Replace with your Cloudinary API key
  api_secret: 'ZPgaTKkfmxgap5QnAgUcg5qSlKY', // Replace with your Cloudinary API secret
});

// Local storage configuration for debugging
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');  // Ensure the uploads folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Unique filename with timestamp
  },
});

const localUpload = multer({ storage: localStorage });

// Cloudinary storage engine
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'restaurant-uploads', // Cloudinary folder name
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const cloudUpload = multer({ storage: cloudinaryStorage });

const foodRouter = express.Router();

// Route for adding food (with local file upload for debugging)
foodRouter.post("/add", (req, res, next) => {
  console.log("🔵 Request received at /api/food/add");  // This log should show up first
  console.log("🔵 Request body:", req.body);  // Log req.body to check the form data
  next();  // Pass control to the next middleware
}, localUpload.single("image"), (req, res, next) => {
  console.log("📁 Multer processed the request:");
  console.log("📁 File received (local upload):", req.file);  // Log file info after multer handles it locally
  
  if (!req.file) {
    console.log("❌ No file received by multer");
    return res.status(400).json({ success: false, message: "No file received" });
  }
  next();  // Continue to the next middleware (addFood function)
}, addFood);

// Route for adding food (with Cloudinary upload after confirming local works)
foodRouter.post("/add", (req, res, next) => {
  console.log("🔵 Request received at /api/food/add");  // This log should show up first
  console.log("🔵 Request body:", req.body);  // Log req.body to check the form data
  next();  // Pass control to the next middleware
}, cloudUpload.single("image"), (req, res, next) => {
  console.log("📁 Multer processed the request with Cloudinary upload:");
  console.log("📁 File received (Cloudinary upload):", req.file);  // Log file info after multer handles it with Cloudinary
  
  if (!req.file) {
    console.log("❌ No file received by Cloudinary");
    return res.status(400).json({ success: false, message: "No file uploaded to Cloudinary" });
  }
  
  next();  // Continue to the next middleware (addFood function)
}, addFood);

// Routes for list and remove food
foodRouter.get("/list", listFood);
foodRouter.post("/remove", removeFood);

export default foodRouter;
