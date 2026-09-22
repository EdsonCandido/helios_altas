import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../queues/redis.js";
import { sendError } from "../utils/http.js";

function createLimiter(prefix: string, windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) =>
        redis.call(args[0] as string, ...args.slice(1)) as Promise<never>,
      prefix,
    }),
    handler: (_req, res) => {
      sendError(res, "TOO_MANY_REQUESTS", "Too many requests.", 429);
    },
  });
}

export const apiRateLimiter = createLimiter("rl:api:", 60_000, 120);
export const authRateLimiter = createLimiter("rl:auth:", 15 * 60_000, 20);
export const geoRateLimiter = createLimiter("rl:geo:", 60_000, 30);
