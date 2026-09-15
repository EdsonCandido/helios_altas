import { Injectable, computed, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { ApiClient } from "../api/api-client";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "CLIENT" | "PARTNER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  clientId?: string | null;
};

@Injectable({ providedIn: "root" })
export class AuthStore {
  private readonly api = inject(ApiClient);
  private readonly router = inject(Router);

  readonly user = signal<PublicUser | null>(null);
  readonly accessToken = signal<string | null>(null);
  readonly role = computed(() => this.user()?.role ?? null);

  async bootstrap(): Promise<void> {
    const stored = localStorage.getItem("helios.accessToken");
    if (!stored) {
      return;
    }

    this.accessToken.set(stored);
    try {
      const me = await this.api.get<PublicUser>("/auth/me").toPromise();
      this.user.set(me ?? null);
    } catch {
      await this.refresh();
    }
  }

  async login(email: string, password: string): Promise<void> {
    const result = await this.api
      .post<{ user: PublicUser; accessToken: string }>("/auth/login", { email, password })
      .toPromise();
    this.setSession(result!);
    await this.redirectHome();
  }

  async register(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "CLIENT" | "PARTNER";
  }): Promise<void> {
    const result = await this.api
      .post<{ user: PublicUser; accessToken: string }>("/auth/register", input)
      .toPromise();
    this.setSession(result!);
    await this.redirectHome();
  }

  async refresh(): Promise<void> {
    const result = await this.api
      .post<{ user: PublicUser; accessToken: string }>("/auth/refresh")
      .toPromise();
    this.setSession(result!);
  }

  async logout(): Promise<void> {
    await this.api.post("/auth/logout").toPromise().catch(() => undefined);
    this.user.set(null);
    this.accessToken.set(null);
    localStorage.removeItem("helios.accessToken");
    await this.router.navigateByUrl("/login");
  }

  private setSession(result: { user: PublicUser; accessToken: string }): void {
    this.user.set(result.user);
    this.accessToken.set(result.accessToken);
    localStorage.setItem("helios.accessToken", result.accessToken);
  }

  private async redirectHome(): Promise<void> {
    const role = this.user()?.role;
    if (role === "ADMIN") {
      await this.router.navigateByUrl("/admin");
      return;
    }
    if (role === "PARTNER") {
      await this.router.navigateByUrl("/parceiro");
      return;
    }
    await this.router.navigateByUrl("/cliente");
  }
}
