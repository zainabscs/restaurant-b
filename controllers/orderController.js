import dotenv from 'dotenv';
dotenv.config();
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe"
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// placing user order for frontend
const placeOrder = async (req, res) => {
    const frontend_url = "http://localhost:5174"; // Use env variable for production
    console.log("Received order request from user:", req.body);

    try {
        // Create new order in the database
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address
        });

        console.log("Saving new order:", newOrder);
        await newOrder.save();

        // Clear user cart data after order placement
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        // Prepare line items for Stripe checkout
        const line_item = req.body.items.map((item) => ({
            price_data: {
                currency: "nzd", // NZD as currency
                product_data: {
                    name: item.name
                },
                unit_amount: item.price * 100 * 1.74 // Adjust for conversion
            },
            quantity: item.quantity
        }));

        console.log("Line items prepared for Stripe:", line_item);

        // Add delivery charge
        line_item.push({
            price_data: {
                currency: "nzd",
                product_data: {
                    name: "Delivery Charges"
                },
                unit_amount: 2 * 1.74 * 100 // Delivery charge in NZD, converted to cents
            },
            quantity: 1
        });

        console.log("Line items with delivery charge:", line_item);

        // Create Stripe session
        const session = await stripe.checkout.sessions.create({
            line_items: line_item,
            mode: 'payment',
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
        });

        console.log("Stripe session created successfully:", session);

        // Return session URL to frontend
        res.json({ success: true, session_url: session.url });
    } catch (error) {
        console.error("Error placing order:", error);
        res.json({ success: false, message: error.message || "Error placing order." });
    }
};

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;

    if (!orderId) {
        return res.json({ success: false, message: "Order ID is missing" });
    }

    try {
        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        if (success === "true") {
            // Update order payment status
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Payment Successful" });
        } else {
            // Delete order if payment is not successful
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "Payment Failed, Order Deleted" });
        }
    } catch (error) {
        console.error("Error in verifying order:", error);
        res.json({ success: false, message: "Error verifying the order" });
    }
};
// /users order for frontend
const usersOrders=async (req,res)=>{
    try {
        const orders=await orderModel.find({userId:req.body.userId})
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

// listing orders for admin panel
const listOrders=async(req,res)=>{
    try {
        const orders=await orderModel.find({});
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}
// api for updating order status
const updateStatus=async (req,res)=>{
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status});
        res.json({success:true,message:"Status Updated"});
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"}) 
    }
}
export { placeOrder,verifyOrder,usersOrders ,listOrders,updateStatus }
