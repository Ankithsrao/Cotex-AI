import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./shared/redis/redis.js";
import authRoutes from "./routes/auth.routh.js";

import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

dotenv.config();
connectDb();

const app = express();
const port = Number(process.env.PORT) || 8001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "Auth Service is running" });
});

app.use("/auth", authRoutes);

app.listen(port, "127.0.0.1", () => {
  console.log(`Auth Service started on ${port}`);
});


