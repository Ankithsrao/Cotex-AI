export const protectRoute = async (req, res, next) => {
    try {
        // Read the session cookie sent by the browser
        const sessionId = req.cookies.session;

        if (!sessionId) {
            return res.status(401).json({ message: "Unauthorized - No session cookie provided" });
        }

        // If cookie is present, allow access to the next controller
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({ message: "Unauthorized - Invalid session" });
    }
};