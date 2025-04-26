import dotenv from "dotenv";
dotenv.config();
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Placing user order for frontend
const placeOrder = async (req, res) => {
    const frontend_url = process.env.FRONTEND_URL || "http://localhost:5173";
    console.log("Received order request from user:", req.body);

    try {
        // Validate request body
        if (!req.body.userId || !Array.isArray(req.body.items) || req.body.items.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid order data" });
        }

        // Validate item prices (Stripe minimum amount: 50 cents)
        const line_items = req.body.items.map((item) => {
            if (item.price < 50) {
                throw new Error(`Item "${item.name}" has a price below the minimum allowed by Stripe ($0.50 NZD).`);
            }
            return {
                price_data: {
                    currency: "nzd",
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: item.price,
                },
                quantity: item.quantity,
            };
        });

        // Create Stripe session
        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${frontend_url}/verify?success=true&orderId=temp&token=${req.headers.token}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=temp&token=${req.headers.token}`,
        });

        // Create order and include session ID
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            sessionId: session.id,
        });

        await newOrder.save();

        // Update success/cancel URLs with real order ID
        const updatedSession = await stripe.checkout.sessions.update(session.id, {
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}&token=${req.headers.token}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}&token=${req.headers.token}`,
        });

        // Clear user cart
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        // Send updated session URL to user
        res.json({ success: true, session_url: updatedSession.url });
    } catch (error) {
        console.error("Error placing order:", error.message);
        res.status(500).json({ success: false, message: error.message || "Error placing order." });
    }
};

// Verifying order status using sessionId from DB
const verifyOrder = async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({ success: false, message: "Order ID is missing" });
    }

    try {
        const order = await orderModel.findById(orderId);
        if (!order || !order.sessionId) {
            return res.status(404).json({ success: false, message: "Order not found or sessionId missing" });
        }

        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(order.sessionId);

        // Check payment status
        if (session.payment_status === "paid") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Payment Successful" });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "Payment Failed, Order Deleted" });
        }
    } catch (error) {
        console.error("Error verifying order:", error.message);
        res.status(500).json({ success: false, message: "Error verifying the order" });
    }
};

// Fetching user orders
const usersOrders = async (req, res) => {
    try {
        if (!req.body.userId) {
            return res.status(400).json({ success: false, message: "User ID is missing" });
        }

        const orders = await orderModel.find({ userId: req.body.userId });
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error("Error fetching user orders:", error.message);
        res.status(500).json({ success: false, message: "Error fetching orders" });
    }
};

// Listing all orders for admin panel
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error("Error listing orders:", error.message);
        res.status(500).json({ success: false, message: "Error listing orders" });
    }
};

// Updating order status
const updateStatus = async (req, res) => {
    try {
        if (!req.body.orderId || !req.body.status) {
            return res.status(400).json({ success: false, message: "Order ID or status is missing" });
        }

        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        console.error("Error updating order status:", error.message);
        res.status(500).json({ success: false, message: "Error updating order status" });
    }
};

export { placeOrder, verifyOrder, usersOrders, listOrders, updateStatus };