import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from "@angular/core";
import { provideRouter } from "@angular/router";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/auth/auth.interceptor";
import { AuthStore } from "./core/auth/auth.store";
import { loadAppConfig } from "./core/config";
import { SocketService } from "./core/socket/socket.service";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(async () => {
      const auth = inject(AuthStore);
      const socket = inject(SocketService);
      await loadAppConfig();
      await auth.bootstrap();
      if (auth.user()) {
        socket.connect();
      }
    }),
  ],
};
