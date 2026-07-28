import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import adminRoutes from "./routes/admin.js";
import { adminLimiter } from "./middleware/rateLimiter.js";
import { startCacheScheduler } from "./cache/cacheScheduler.js";
import heartbeatRoutes from "./routes/heartbeat.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.DEV_URL,
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use("/admin", adminLimiter);
app.use("/admin", adminRoutes);
app.use("/", heartbeatRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startCacheScheduler();
});