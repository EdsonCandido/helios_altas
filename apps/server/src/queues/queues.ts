import { Queue } from "bullmq";
import { redis } from "./redis.js";

export const matchingQueue = new Queue("matching", { connection: redis });
export const notificationQueue = new Queue("notifications", { connection: redis });
export const expirationQueue = new Queue("expiration", { connection: redis });
