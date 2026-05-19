import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import docsRouter from "@/routers/docs";
import client from "prom-client";
const app = express();
const frontendOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());
import { metricsMiddleware } from "@/prom/middleware";
import redis from "@/utils/redis";
import MongoDBClient from "@/client/db";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

// Service connection state
let redisStatus: "connected" | "disconnected" = "disconnected";
let mongoStatus: "connected" | "disconnected" = "disconnected";
let s3Status: "connected" | "disconnected" = "disconnected";

// CORS configuration
app.use(
  cors({
    origin: [...frontendOrigins, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(metricsMiddleware);

// Health check endpoint
client.collectDefaultMetrics();
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    redis: redisStatus,
    mongo: mongoStatus,
    objectStore: s3Status,
  });
});
app.get("/metrics", async (req, res) => {
  const metrics = await client.register.metrics();

  res.set("Content-Type", client.register.contentType);
  res.end(metrics);
});
app.get("/metrics", async (req, res) => {
  const metrics = await client.register.metrics();
  res.set("Content-Type", client.register.contentType);
  res.end(metrics);
});

app.use("/docs", docsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = Number(process.env.PORT || 8080);

(async () => {
  try {
    // Check Redis connectivity
    try {
      await redis.ping();
      redisStatus = "connected";
      console.log("✅ Redis connected");
    } catch (err) {
      console.error("❌ Redis connection failed:", err);
    }

    // Check MongoDB connectivity
    try {
      const db = await MongoDBClient.getInstance();
      await db.ping();
      mongoStatus = "connected";
      console.log("✅ MongoDB connected");
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err);
    }

    // Check S3 connectivity (HeadBucket on the configured bucket)
    try {
      const s3 = new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      await s3.send(
        new HeadBucketCommand({ Bucket: process.env.AWS_S3_BUCKET! }),
      );
      s3Status = "connected";
      console.log("✅ S3 connected");
    } catch (err) {
      console.error("❌ S3 connection failed:", err);
    }

    app.listen(PORT, () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
      console.log(`📡 Frontend URLs: ${frontendOrigins.join(", ")}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  }
})();
