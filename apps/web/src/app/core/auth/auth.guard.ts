import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthStore } from "./auth.store";

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  return auth.user() ? true : router.createUrlTree(["/login"]);
};

export function roleGuard(...roles: Array<"CLIENT" | "PARTNER" | "ADMIN">): CanActivateFn {
  return () => {
    const auth = inject(AuthStore);
    const router = inject(Router);
    const role = auth.role();
    return role && roles.includes(role) ? true : router.createUrlTree(["/login"]);
  };
}
