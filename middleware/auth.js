import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
    const { token } = req.headers;

    if (!token) {
        return res.json({ success: false, message: "Not Authorized. Login Again" });
    }

    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check that the decoded token contains the user ID
        if (!token_decode.id) {
            return res.json({ success: false, message: "Invalid token." });
        }

        req.body.userId = token_decode.id; // Attach user ID to the request body for further use
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.log("JWT Error:", error); // Log error for debugging
        res.json({ success: false, message: error.message || "Token validation failed." });
    }
};

export default authMiddleware;
