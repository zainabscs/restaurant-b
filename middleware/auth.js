import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
    const token = req.headers['token']; // ✅ safer than destructuring

    if (!token) {
        return res.json({ success: false, message: "Not Authorized. Login Again" });
    }

    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);

        if (!token_decode.id) {
            return res.json({ success: false, message: "Invalid token." });
        }

        req.body.userId = token_decode.id;
        next();
    } catch (error) {
        console.log("JWT Error:", error);
        res.json({ success: false, message: error.message || "Token validation failed." });
    }
};


export default authMiddleware;
