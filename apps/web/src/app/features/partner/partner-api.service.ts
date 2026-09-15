import { Injectable, inject } from "@angular/core";
import { ApiClient } from "../../core/api/api-client";

@Injectable({ providedIn: "root" })
export class PartnerApiService {
  private readonly api = inject(ApiClient);

  me() {
    return this.api.get<Record<string, unknown>>("/partners/me");
  }

  update(body: Record<string, unknown>) {
    return this.api.put("/partners/me", body);
  }

  availability(body: Record<string, unknown>) {
    return this.api.patch("/partners/me/availability", body);
  }

  services(items: unknown[]) {
    return this.api.put("/partners/me/services", { items });
  }

  requests() {
    return this.api.get<Array<Record<string, unknown>>>("/service-requests");
  }

  request(id: string) {
    return this.api.get<Record<string, unknown>>(`/service-requests/${id}`);
  }

  accept(id: string) {
    return this.api.post(`/service-requests/${id}/accept`);
  }

  reject(id: string, reason: string) {
    return this.api.post(`/service-requests/${id}/reject`, { reason });
  }

  start(id: string) {
    return this.api.post(`/service-requests/${id}/start`);
  }

  complete(id: string) {
    return this.api.post(`/service-requests/${id}/complete`);
  }
}
