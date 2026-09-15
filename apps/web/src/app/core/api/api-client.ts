import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { getAppConfig } from "../config";

type ApiResponse<T> = { data: T };

@Injectable({ providedIn: "root" })
export class ApiClient {
  private readonly http = inject(HttpClient);

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Observable<T> {
    let httpParams = new HttpParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return new Observable<T>((subscriber) => {
      this.http
        .get<ApiResponse<T>>(this.url(path), { params: httpParams, withCredentials: true })
        .subscribe({
          next: (response) => {
            subscriber.next(response.data);
            subscriber.complete();
          },
          error: (error) => subscriber.error(error),
        });
    });
  }

  post<T>(path: string, body: unknown = {}): Observable<T> {
    return this.request<T>("POST", path, body);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>("PATCH", path, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>("PUT", path, body);
  }

  private request<T>(method: string, path: string, body: unknown): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.http
        .request<ApiResponse<T>>(method, this.url(path), { body, withCredentials: true })
        .subscribe({
          next: (response) => {
            subscriber.next(response.data);
            subscriber.complete();
          },
          error: (error) => subscriber.error(error),
        });
    });
  }

  private url(path: string): string {
    return `${getAppConfig().apiUrl}/api/v1${path}`;
  }
}
