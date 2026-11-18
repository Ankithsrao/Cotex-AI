import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import cors from "cors"
import cookieParser from "cookie-parser";
import dns from "dns";
import router from "./agents/routes/agent.route.js";

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
app.use("/",router)

app.use((req,res,err,next)=>{
  console.log(err)

  if(err.status){
    return res.status(status).json(err.data)
  }

  return res.status(500).json({message: `agent error ${err}`})
})


app.get("/", (req, res) => {
  res.json({ message: "hello from agent" });
});


app.listen(port, "127.0.0.1", () => {
  console.log(`agent Service started on ${port}`);
});
