import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import cors from "cors"
import cookieParser from "cookie-parser";



import dns from "dns";
import router from "./routes/chat.routes.js";
dns.setDefaultResultOrder("ipv4first");

dotenv.config();
await connectDb();


const app = express();
const port = Number(process.env.PORT) || 8002;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: "12mb" }));
app.use(cookieParser());

app.use("/",router)

app.get("/", (req, res) => {
  res.json({ message: "Chat Service is running" });
});


app.listen(port, "127.0.0.1", () => {
  console.log(`Chat Service started on ${port}`);
});
