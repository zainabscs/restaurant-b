import userModel from "../models/userModel.js"

// add items to user cart
const addToCart = async (req, res) => {
    try {
        // Pehle confirm karo ke userId send ho raha hai
        if (!req.body.userId || !req.body.itemId) {
            return res.json({ success: false, message: "userId or itemId missing!" });
        }

        // Check karo ke user exist karta hai ya nahi
        let userData = await userModel.findOne({ _id: req.body.userId });

        if (!userData) {
            return res.json({ success: false, message: "User not found in the database!" });
        }

        // Check karo ke userData.cartData exist karta hai ya nahi
        if (!userData.cartData) {
            userData.cartData = {}; // Agar nahi hai toh initialize kar do
        }

        // Item ko cartData mein add karo
        if (!userData.cartData[req.body.itemId]) {
            userData.cartData[req.body.itemId] = 1;
        } else {
            userData.cartData[req.body.itemId] += 1;
        }

        // Update the user with new cartData
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: userData.cartData });

        res.json({ success: true, message: "Added To Cart" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}


// remove items from user cart
const removeFromCart = async (req, res) => {
    try {
        // Confirm karo ke userId aur itemId send ho rahe hain
        if (!req.body.userId || !req.body.itemId) {
            return res.json({ success: false, message: "userId or itemId missing!" });
        }

        // Check karo ke user exist karta hai ya nahi
        let userData = await userModel.findOne({ _id: req.body.userId });

        if (!userData) {
            return res.json({ success: false, message: "User not found in the database!" });
        }

        // Check karo ke userData.cartData exist karta hai ya nahi
        if (!userData.cartData || !userData.cartData[req.body.itemId]) {
            return res.json({ success: false, message: "Item not found in cart!" });
        }

        // Item ko cartData mein se remove karo
        if (userData.cartData[req.body.itemId] > 1) {
            userData.cartData[req.body.itemId] -= 1;  // Agar quantity zyada hai to kam kar do
        } else {
            delete userData.cartData[req.body.itemId]; // Agar quantity 1 hai to item ko delete kar do
        }

        // Update the user with updated cartData
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: userData.cartData });

        res.json({ success: true, message: "Removed From Cart" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}


// fetchuser cart data
const getCart = async (req, res) => {
    try {
        let userData=await userModel.findById(req.body.userId);
        let cartData=await userData.cartData;
        res.json({success:true,cartData})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:"Error"})
    }
}

export { addToCart, removeFromCart, getCart }