import dotenv from 'dotenv';
dotenv.config();
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// placing user order for frontend
const placeOrder = async (req, res) => {
    const frontend_url = process.env.FRONTEND_URL || "http://localhost:5173";
    console.log("Received order request from user:", req.body);

    try {
        // Prepare line items for Stripe checkout
        const line_item = req.body.items.map((item) => ({
            price_data: {
                currency: "nzd",
                product_data: {
                    name: item.name
                },
                unit_amount: item.price
            },
            quantity: item.quantity
        }));


        // 🔄 Create Stripe session FIRST
        const session = await stripe.checkout.sessions.create({
            line_items: line_item,
            mode: 'payment',
            success_url: `${frontend_url}/verify?success=true&orderId=temp&token=${req.headers.token}`, // will replace orderId later
            cancel_url: `${frontend_url}/verify?success=false&orderId=temp&token=${req.headers.token}`,
        });

        // ✅ Now create order and include session ID
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            sessionId: session.id // ✅ Added sessionId here
        });

        await newOrder.save();

        // 🔄 Fix success/cancel URLs with real order ID
        const updatedSession = await stripe.checkout.sessions.update(session.id, {
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}&token=${req.headers.token}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}&token=${req.headers.token}`,
        });

        // Clear user cart
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        // Send updated session URL
        res.json({ success: true, session_url: updatedSession.url });

    } catch (error) {
        console.error("Error placing order:", error);
        res.json({ success: false, message: error.message || "Error placing order." });
    }
};

// 🔄 VERIFY using sessionId from DB
const verifyOrder = async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.json({ success: false, message: "Order ID is missing" });
    }

    try {
        const order = await orderModel.findById(orderId);
        if (!order || !order.sessionId) {
            return res.json({ success: false, message: "Order not found or sessionId missing" });
        }

        // ✅ Get actual session from Stripe
        const session = await stripe.checkout.sessions.retrieve(order.sessionId);

        // ✅ Check Stripe’s real payment status
        if (session.payment_status === "paid") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "Payment Successful" });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "Payment Failed, Order Deleted" });
        }
    } catch (error) {
        console.error("Error in verifying order:", error);
        res.json({ success: false, message: "Error verifying the order" });
    }
};

// /users order for frontend
const usersOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId })
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// listing orders for admin panel
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}
// api for updating order status
const updateStatus = async (req, res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}
export { placeOrder, verifyOrder, usersOrders, listOrders, updateStatus }
