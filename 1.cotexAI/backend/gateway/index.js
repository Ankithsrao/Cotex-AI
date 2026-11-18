import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy";
import cors from "cors";
import cookieParser from "cookie-parser";
import axios from "axios";
import { getCurrentUser } from "./controllers/user.controller.js";
import protect from "./middleware/auth.middleware.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";
import  morgan from "morgan"

dotenv.config();

const port = process.env.PORT || 8000;
const app = express();

const authService = process.env.AUTH_SERVICE;
const chatService = process.env.CHAT_SERVICE;
const agentService = process.env.AGENT_SERVICE;
const billingService = process.env.BILLING_SERVICE; 
const frontendUrl =
    process.env.FRONTEND_URL || "http://localhost:5173";

if (!authService) {
    throw new Error("AUTH_SERVICE is missing from the Gateway .env file");
}

app.use(cors({
    origin: frontendUrl,
    credentials: true
}));
app.use(morgan("dev"))
app.use(express.json());
app.use(cookieParser());

app.post("/api/auth/login", async (req, res) => {
    try {
        const authResponse = await axios.post(
            `${authService}/auth/login`,
            req.body
        );

        const { user, sessionId } = authResponse.data;

        if (!sessionId) {
            console.error("Auth Service did not return sessionId");
            return res.status(500).json({
                message: "Auth Service did not return a session ID"
            });
        }

        res.cookie("session", sessionId, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json(user);

    } catch (err) {
        return res.status(err.response?.status || 500).json({
            message: err.response?.data?.message || err.message
        });
    }
});

app.get("/api/auth/me", protect, getCurrentUser);

// Proxy other Auth Service routes
app.use("/api/auth", proxy(authService));
app.use("/api/chat",protect, proxyWithHeader(chatService));
app.use("/api/agent",protect, proxyWithHeader(agentService, { limit: 21 * 1024 * 1024 }));
app.use("/api/billing",protect, proxyWithHeader(billingService));

app.get("/", (req, res) => {
    res.json({ message: "Hello from Gateway" });
});

app.listen(port, () => {
    console.log(`Gateway started on port ${port}`);
});