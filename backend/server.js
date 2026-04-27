import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import askRoute from "./routes/ask.js";
import authRoutes from "./routes/auth.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

//Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

//Custom CORS settings
const corsOptions = {
  origin: ["http://localhost:5173", "https://readingassist.netlify.app"],
  methods: ["GET", "POST", "OPTIONS"], // allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // allowed headers
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api", askRoute);
app.use("/api/auth", authRoutes); 

app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
