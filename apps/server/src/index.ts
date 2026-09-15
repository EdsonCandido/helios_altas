import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createServer } from "node:http";
import pinoHttp from "pino-http";

const httpLogger = (pinoHttp as unknown as (options: { logger: typeof logger; serializers: object }) => express.RequestHandler);
import { env } from "./config/env.js";
import { pool } from "./db/index.js";
import { registerNotificationHandlers } from "./modules/notifications/notification.service.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { apiRateLimiter } from "./middlewares/rate-limit.js";
import { redis } from "./queues/redis.js";
import { startWorkers } from "./queues/workers.js";
import { realtimeGateway } from "./realtime/realtime-gateway.js";
import { createRoutes } from "./routes/index.js";
import { logger } from "./utils/logger.js";
import { sendData } from "./utils/http.js";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS.split(",").map((item) => item.trim()),
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  (pinoHttp as unknown as (options: object) => express.RequestHandler)({
    logger,
    serializers: {
      req(request: { method: string; url: string }) {
        return { method: request.method, url: request.url };
      },
    },
  }),
);
app.use(apiRateLimiter);

app.get("/health", (_req, res) => {
  sendData(res, { status: "ok" });
});

app.get("/ready", async (_req, res, next) => {
  try {
    await pool.query("select 1");
    const pong = await redis.ping();
    sendData(res, { status: "ready", redis: pong });
  } catch (error) {
    next(error);
  }
});

app.use("/api/v1", createRoutes());
app.use(errorHandler);

realtimeGateway.attach(httpServer);
registerNotificationHandlers();
startWorkers();

httpServer.listen(env.API_PORT, () => {
  logger.info({ event: "server_started", port: env.API_PORT }, "API listening");
});
