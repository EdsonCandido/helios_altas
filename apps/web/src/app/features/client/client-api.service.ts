import { Injectable, inject } from "@angular/core";
import { ApiClient } from "../../core/api/api-client";

@Injectable({ providedIn: "root" })
export class ClientApiService {
  private readonly api = inject(ApiClient);

  categories() {
    return this.api.get<Array<{ id: string; name: string; slug: string }>>("/categories");
  }

  nearby(params: { latitude: number; longitude: number; categoryId?: string; radiusMeters?: number }) {
    return this.api.get<
      Array<{
        id: string;
        name: string;
        description: string;
        neighborhood: string;
        city: string;
        category: string;
        categoryId: string;
        minimumVisitFeeCents: number;
        isAvailable: boolean;
        distanceMeters: number;
      }>
    >("/partners/nearby", params);
  }

  partner(id: string, origin?: { latitude: number; longitude: number }) {
    return this.api.get<Record<string, unknown>>(`/partners/${id}`, origin);
  }

  createRequest(body: Record<string, unknown>) {
    return this.api.post("/service-requests", body);
  }

  requests() {
    return this.api.get<Array<Record<string, unknown>>>("/service-requests");
  }

  request(id: string) {
    return this.api.get<Record<string, unknown>>(`/service-requests/${id}`);
  }

  cancel(id: string) {
    return this.api.post(`/service-requests/${id}/cancel`);
  }

  notifications() {
    return this.api.get<Array<Record<string, unknown>>>("/notifications");
  }

  profile() {
    return this.api.get<Record<string, unknown>>("/clients/me");
  }

  updateProfile(body: Record<string, unknown>) {
    return this.api.patch("/clients/me", body);
  }
}
