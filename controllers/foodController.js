import foodModel from "../models/foodModel.js";
import cloudinary from "../config/cloudinary.js";

// add food item
const addFood = async (req, res) => {
    let { name, description, price, category } = req.body;
    let image_url = req.file.path; // Cloudinary URL

    const food = new foodModel({
        name,
        description,
        price,
        category,
        image: image_url // Save Cloudinary URL in DB
    });

    try {
        await food.save();
        res.json({ success: true, message: "Food Added", image: image_url });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// all food list
const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({});
        res.json({ success: true, data: foods });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// remove food item
const removeFood = async (req, res) => {
    try {
        const food = await foodModel.findById(req.body.id);
        if (!food) {
            return res.json({ success: false, message: "Food item not found!" });
        }

        // Cloudinary se image delete karo
        const imagePublicId = food.image.split('/').pop().split('.')[0]; // Extract public_id
        await cloudinary.uploader.destroy(`restaurant-uploads/${imagePublicId}`);

        // DB se remove karo
        await foodModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Food Removed" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

export { addFood, listFood, removeFood };
