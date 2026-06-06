import IORedis from "ioredis";

export function createRedisClient(): IORedis {
  const client = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });
  client.on("error", (err) => console.error("[Redis] error:", err.message));
  client.on("connect", () => console.log("[Redis] connected"));
  return client;
}
