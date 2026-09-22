import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { getApiErrorMessage } from "../../core/api/api-error";
import { MapComponent } from "../../shared/map/map.component";
import { statusClass, statusLabel } from "../../shared/ui/status";
import { PartnerApiService } from "./partner-api.service";

@Component({
  selector: "app-partner-request-detail-page",
  imports: [FormsModule, RouterLink, MapComponent],
  template: `
    <section class="stack">
      <a class="link-quiet" routerLink="/parceiro">Voltar à caixa</a>
      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }
      @if (loading()) {
        <div class="skeleton" aria-busy="true">
          <span class="skeleton-line mid"></span>
          <span class="skeleton-block"></span>
        </div>
      } @else if (item(); as request) {
        <header class="page-head">
          <div>
            <p class="kicker">Atendimento</p>
            <h1>{{ request["categoryName"] }}</h1>
            <p class="lede">Revise o local, aceite ou recuse o convite.</p>
          </div>
          <span [class]="statusClass(request['inviteStatus'] ?? request['status'])">
            {{ statusLabel(request["inviteStatus"] ?? request["status"]) }}
          </span>
        </header>
        @if (canRespond()) {
          <div class="panel actions partner-request-actions">
            <button class="btn btn-success" type="button" (click)="accept()" [disabled]="working()">
              {{ working() ? "Enviando…" : "Aceitar" }}
            </button>
            <button class="btn btn-danger" type="button" (click)="reject()" [disabled]="working()">
              Recusar
            </button>
          </div>
        }

        <div class="detail-layout">
          <article class="panel stack">
            <p>{{ request["description"] }}</p>
            @if (request["isHomeService"]) {
              <p class="meta">Atendimento na residência</p>
            }
            <div class="stack">
              <p class="panel-title">Local do atendimento</p>
              @if (fullAddress()) {
                <p>{{ fullAddress() }}</p>
              } @else {
                <p class="meta">{{ request["neighborhood"] }}, {{ request["city"] }}</p>
              }
              @if (mapsUrl(); as url) {
                <a class="btn btn-ghost" [href]="url" target="_blank" rel="noopener noreferrer">
                  Abrir no Google Maps
                </a>
              }
            </div>
            @if (hasCoords()) {
              <div class="map-frame">
                <app-map
                  label="Local da solicitação"
                  [center]="mapCenter()"
                  [zoom]="15"
                  [markers]="mapMarkers()"
                />
              </div>
            }
          </article>
          <aside class="detail-aside panel stack">
            <p class="panel-title">Ações</p>
            @if (canRespond()) {
              <div class="actions">
                <button class="btn btn-success" type="button" (click)="accept()" [disabled]="working()">
                  {{ working() ? "Enviando…" : "Aceitar" }}
                </button>
                <button class="btn btn-danger" type="button" (click)="reject()" [disabled]="working()">
                  Recusar
                </button>
              </div>
              <label class="field">
                Motivo da recusa
                <input name="reason" [(ngModel)]="reason" placeholder="Opcional" />
              </label>
            } @else if (request["status"] === "ACCEPTED" || request["inviteStatus"] === "ACCEPTED") {
              <div class="actions">
                <button class="btn btn-primary" type="button" (click)="start()" [disabled]="working()">
                  Iniciar atendimento
                </button>
              </div>
            } @else if (request["status"] === "IN_PROGRESS") {
              <div class="actions">
                <button class="btn btn-success" type="button" (click)="complete()" [disabled]="working()">
                  Concluir
                </button>
              </div>
            } @else {
              <p class="meta">Nenhuma ação disponível neste status.</p>
            }
          </aside>
        </div>
      }
    </section>
  `,
})
export class PartnerRequestDetailPage {
  private readonly api = inject(PartnerApiService);
  private readonly route = inject(ActivatedRoute);
  item = signal<Record<string, unknown> | null>(null);
  loading = signal(true);
  working = signal(false);
  error = signal("");
  reason = "";
  private requestId = "";
  readonly statusLabel = statusLabel;
  readonly statusClass = statusClass;

  readonly hasCoords = computed(() => {
    const request = this.item();
    return Number.isFinite(Number(request?.["latitude"])) && Number.isFinite(Number(request?.["longitude"]));
  });

  readonly mapCenter = computed<[number, number]>(() => {
    const request = this.item();
    return [Number(request?.["latitude"]), Number(request?.["longitude"])];
  });

  readonly mapMarkers = computed(() => {
    if (!this.hasCoords()) {
      return [];
    }
    const [lat, lng] = this.mapCenter();
    return [{ lat, lng, label: "Local do atendimento" }];
  });

  readonly fullAddress = computed(() => {
    const request = this.item();
    if (!request?.["address"]) {
      return "";
    }
    const number = request["addressNumber"] ? `, ${String(request["addressNumber"])}` : "";
    const neighborhood = request["neighborhood"] ? ` — ${String(request["neighborhood"])}` : "";
    const city = request["city"] ? `, ${String(request["city"])}` : "";
    const state = request["state"] ? `/${String(request["state"])}` : "";
    return `${String(request["address"])}${number}${neighborhood}${city}${state}`;
  });

  readonly mapsUrl = computed(() => {
    if (!this.hasCoords()) {
      return null;
    }
    const [lat, lng] = this.mapCenter();
    return `https://www.google.com/maps?q=${lat},${lng}`;
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      this.requestId = params.get("id") ?? "";
      if (this.requestId) {
        this.reload();
      }
    });
  }

  canRespond(): boolean {
    const request = this.item();
    if (!request || request["status"] !== "SEARCHING") {
      return false;
    }
    const invite = request["inviteStatus"];
    return invite === "PENDING" || invite === undefined || invite === null;
  }

  reload(): void {
    this.loading.set(true);
    this.error.set("");
    this.api.request(this.id).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(getApiErrorMessage(err, "Não foi possível carregar a solicitação."));
      },
    });
  }

  accept(): void {
    this.working.set(true);
    this.error.set("");
    this.api.accept(this.id).subscribe({
      next: () => {
        this.working.set(false);
        this.reload();
      },
      error: (err: unknown) => {
        this.working.set(false);
        this.error.set(getApiErrorMessage(err, "Não foi possível aceitar a solicitação."));
      },
    });
  }

  reject(): void {
    this.working.set(true);
    this.error.set("");
    this.api.reject(this.id, this.reason || "Indisponível no momento").subscribe({
      next: () => {
        this.working.set(false);
        this.reload();
      },
      error: (err: unknown) => {
        this.working.set(false);
        this.error.set(getApiErrorMessage(err, "Não foi possível recusar a solicitação."));
      },
    });
  }

  start(): void {
    this.working.set(true);
    this.error.set("");
    this.api.start(this.id).subscribe({
      next: () => {
        this.working.set(false);
        this.reload();
      },
      error: (err: unknown) => {
        this.working.set(false);
        this.error.set(getApiErrorMessage(err, "Não foi possível iniciar o atendimento."));
      },
    });
  }

  complete(): void {
    this.working.set(true);
    this.error.set("");
    this.api.complete(this.id).subscribe({
      next: () => {
        this.working.set(false);
        this.reload();
      },
      error: (err: unknown) => {
        this.working.set(false);
        this.error.set(getApiErrorMessage(err, "Não foi possível concluir o atendimento."));
      },
    });
  }

  private get id(): string {
    return this.requestId;
  }
}
