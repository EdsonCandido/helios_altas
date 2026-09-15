import { Injectable, inject } from "@angular/core";
import { io, type Socket } from "socket.io-client";
import { getAppConfig } from "../config";
import { AuthStore } from "../auth/auth.store";

@Injectable({ providedIn: "root" })
export class SocketService {
  private readonly auth = inject(AuthStore);
  private socket?: Socket;

  connect(): void {
    const token = this.auth.accessToken();
    if (!token || this.socket) {
      return;
    }

    this.socket = io(getAppConfig().socketUrl, {
      auth: { token },
      withCredentials: true,
    });
  }

  onNotification(handler: (payload: unknown) => void): void {
    this.socket?.on("notification", handler);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = undefined;
  }
}
