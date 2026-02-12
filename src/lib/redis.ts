import Redis from "ioredis";

// Connect to local Redis (default port 6379)
export const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

redis.on("error", (err) => {
  console.log("Redis error:", err);
});
