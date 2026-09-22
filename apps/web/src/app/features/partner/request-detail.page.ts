import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { statusClass, statusLabel } from "../../shared/ui/status";
import { PartnerApiService } from "./partner-api.service";

@Component({
  selector: "app-partner-request-detail-page",
  imports: [FormsModule, RouterLink],
  template: `
    <section class="stack">
      <a class="link-quiet" routerLink="/parceiro">Voltar à caixa</a>
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
          </div>
          <span [class]="statusClass(request['status'])">{{ statusLabel(request["status"]) }}</span>
        </header>
        <div class="detail-layout">
          <article class="panel stack">
            <p>{{ request["description"] }}</p>
            <p class="meta">{{ request["neighborhood"] }}, {{ request["city"] }}</p>
            @if (request["address"]) {
              <p class="meta">{{ request["address"] }}</p>
            }
          </article>
          <aside class="detail-aside panel">
            <p class="panel-title">Ações</p>
            @if (request["status"] === "SEARCHING") {
              <div class="actions">
                <button class="btn btn-success" type="button" (click)="accept()" [disabled]="working()">
                  Aceitar
                </button>
                <button class="btn btn-danger" type="button" (click)="reject()" [disabled]="working()">
                  Recusar
                </button>
              </div>
              <label class="field">Motivo da recusa <input name="reason" [(ngModel)]="reason" /></label>
            }
            @if (request["status"] === "ACCEPTED") {
              <div class="actions">
                <button class="btn btn-primary" type="button" (click)="start()" [disabled]="working()">
                  Iniciar atendimento
                </button>
              </div>
            }
            @if (request["status"] === "IN_PROGRESS") {
              <div class="actions">
                <button class="btn btn-success" type="button" (click)="complete()" [disabled]="working()">
                  Concluir
                </button>
              </div>
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
  reason = "";
  readonly statusLabel = statusLabel;
  readonly statusClass = statusClass;

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.api.request(this.id).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  accept(): void {
    this.working.set(true);
    this.api.accept(this.id).subscribe({
      next: () => {
        this.working.set(false);
        this.reload();
      },
      error: () => this.working.set(false),
    });
  }

  reject(): void {
    this.working.set(true);
    this.api.reject(this.id, this.reason || "Indisponível no momento").subscribe({
      next: () => {
        this.working.set(false);
        this.reload();
      },
      error: () => this.working.set(false),
    });
  }

  start(): void {
    this.working.set(true);
    this.api.start(this.id).subscribe({
      next: () => {
        this.working.set(false);
        this.reload();
      },
      error: () => this.working.set(false),
    });
  }

  complete(): void {
    this.working.set(true);
    this.api.complete(this.id).subscribe({
      next: () => {
        this.working.set(false);
        this.reload();
      },
      error: () => this.working.set(false),
    });
  }

  private get id(): string {
    return this.route.snapshot.paramMap.get("id")!;
  }
}
