import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import adminRoutes from "./routes/admin.js";
import { adminLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/admin", adminLimiter);

app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "EduTrack Admin API Running"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});