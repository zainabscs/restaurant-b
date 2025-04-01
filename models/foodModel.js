import mongoose from "mongoose";


const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
})

const foodModel=mongoose.models.food||mongoose.model("food",foodSchema);
// if there is no model it will create one ,else will use the created one

export default foodModel;