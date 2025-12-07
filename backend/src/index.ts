import express from "express";
import cors from "cors";
import docsRouter from "@/routers/docs";
import client from "prom-client";
const app = express();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
import { cronJob } from "./cron";
import { metricsMiddleware } from "@/prom/middleware";
// CORS configuration
app.use(
  cors({
    origin: [frontendUrl, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(metricsMiddleware);
// Health check endpoint
cronJob.start();
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
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
    app.listen(PORT, () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
      console.log(`📡 Frontend URL: ${frontendUrl}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  }
})();
