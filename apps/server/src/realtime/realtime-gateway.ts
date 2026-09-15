import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { verifyAccessToken } from "../utils/tokens.js";

class RealtimeGateway {
  private io?: Server;

  attach(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: env.CORS_ORIGINS.split(",").map((item) => item.trim()),
        credentials: true,
      },
    });

    this.io.use((socket, next) => {
      const token =
        typeof socket.handshake.auth.token === "string" ? socket.handshake.auth.token : undefined;

      if (!token) {
        next(new Error("UNAUTHORIZED"));
        return;
      }

      try {
        const payload = verifyAccessToken(token);
        socket.data.userId = payload.sub;
        next();
      } catch {
        next(new Error("UNAUTHORIZED"));
      }
    });

    this.io.on("connection", (socket) => {
      const userId = socket.data.userId as string;
      void socket.join(`user:${userId}`);
      logger.info({ event: "socket_connected", userId }, "Socket connected");
    });
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.io?.to(`user:${userId}`).emit(event, payload);
  }
}

export const realtimeGateway = new RealtimeGateway();
