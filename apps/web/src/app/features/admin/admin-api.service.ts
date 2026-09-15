import { Injectable, inject } from "@angular/core";
import { ApiClient } from "../../core/api/api-client";

@Injectable({ providedIn: "root" })
export class AdminApiService {
  private readonly api = inject(ApiClient);

  users(params: Record<string, string | number | undefined>) {
    return this.api.get<{ items: Array<Record<string, unknown>>; total: number }>("/admin/users", params);
  }

  updateUser(id: string, body: Record<string, unknown>) {
    return this.api.patch(`/admin/users/${id}`, body);
  }

  categories() {
    return this.api.get<Array<Record<string, unknown>>>("/admin/categories");
  }

  createCategory(body: Record<string, unknown>) {
    return this.api.post("/admin/categories", body);
  }

  updateCategory(id: string, body: Record<string, unknown>) {
    return this.api.patch(`/admin/categories/${id}`, body);
  }

  requests(params: Record<string, string | undefined>) {
    return this.api.get<Array<Record<string, unknown>>>("/admin/service-requests", params);
  }

  partnersMap(params: Record<string, string | boolean | undefined>) {
    return this.api.get<Array<Record<string, unknown>>>("/admin/maps/partners", params);
  }

  clusters(params: Record<string, string | undefined>) {
    return this.api.get<Array<{ latitude: number; longitude: number; count: number }>>(
      "/admin/maps/service-requests/clusters",
      params,
    );
  }

  indicators() {
    return this.api.get<Record<string, number>>("/admin/indicators");
  }
}
