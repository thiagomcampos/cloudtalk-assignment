import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://redis:6379",
});

(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis!");
  } catch (error) {
    console.error("Error connecting to Redis:", error);
  }
})();

redisClient.on("error", (err) => {
  console.error("Redis client error:", err);
});

redisClient.on("reconnecting", () => {
  console.log("Reconnecting to Redis...");
});

export default redisClient;
