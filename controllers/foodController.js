import foodModel from "../models/foodModel.js";
import fs from 'fs'
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
// add food item

const addFood = async (req, res) => {
    console.log("🔵 Request received for adding food");

    let { name, description, price, category } = req.body;
    console.log("📌 Form Data:", { name, description, price, category });

    try {
        // Check if the image file is received
        if (!req.file) {
            console.log("❌ No file received!");
            return res.status(400).json({ success: false, message: "Image is required" });
        }

        console.log("📤 Uploading image to Cloudinary...");
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'restaurant-uploads',
        });

        // Ensure the upload was successful
        if (!result || !result.secure_url) {
            console.log("❌ Cloudinary upload failed: No image URL received.");
            return res.status(500).json({ success: false, message: "Failed to upload image to Cloudinary" });
        }

        const image_url = result.secure_url;
        console.log("✅ Image uploaded to Cloudinary: ", image_url);

        // Create the food data object
        const foodData = {
            name,
            description,
            price,
            category,
            image: image_url,
        };
        console.log("💾 Saving food to the database with the following data: ", foodData);

        // Create a new food item and save it to the database
        const food = new foodModel(foodData);
        const savedFood = await food.save();

        // Check if the food was saved successfully
        if (!savedFood) {
            console.log("❌ Error saving food to the database");
            return res.status(500).json({ success: false, message: "Failed to save food data to database" });
        }

        console.log("✅ Food added successfully:", savedFood);
        res.json({ success: true, message: "Food Added", image: image_url });

    } catch (error) {
        console.error("❌ Error adding food:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};




// all food list
const listFood = async (req, res) => {
    try {
        const foods=await foodModel.find({});
        res.json({success:true,data:foods})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"});
    }
}

// remove food item
const removeFood=async(req,res)=>{
    try {
        const food=await foodModel.findById(req.body.id);

        fs.unlink(`uploads/${food.image}`,()=>{})

        await foodModel.findByIdAndDelete(req.body.id);
        res.json({success:true,data:"Food Removed"})

    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"});
    }
}

export { addFood, listFood,removeFood}