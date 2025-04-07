import foodModel from "../models/foodModel.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// Add food
const addFood = async (req, res) => {
    const { name, description, price, category } = req.body;
  
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Image is required" });
      }
  
      console.log("✅ File received:", req.file.originalname);
      console.log("Body Data:", { name, description, price, category });
      console.log("Buffer size:", req.file.buffer?.length);
  
      const base64String = `data:image/png;base64,${req.file.buffer.toString('base64')}`;
  
      const result = await cloudinary.uploader.upload(base64String, {
        folder: "restaurant-uploads",
      });
  
      console.log("✅ Cloudinary upload success:", result.secure_url);
  
      const food = new foodModel({
        name,
        description,
        price,
        category,
        image: result.secure_url,
      });
  
      await food.save();
      console.log("✅ Food saved in DB");
  
      res.json({ success: true, message: "Food Added", image: result.secure_url });
  
    } catch (error) {
      console.error("❌ Error in addFood:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  };
  
  

// List all food
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    res.json({ success: true, data: foods });
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
};

// Remove food
const removeFood = async (req, res) => {
  try {
    await foodModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, data: "Food Removed" });
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
};

export { addFood, listFood, removeFood };
