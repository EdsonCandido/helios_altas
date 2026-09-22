import { Component, inject, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { statusClass, statusLabel } from "../../shared/ui/status";
import { ClientApiService } from "./client-api.service";

@Component({
  selector: "app-client-request-detail-page",
  imports: [RouterLink],
  template: `
    <section class="stack">
      <a class="link-quiet" routerLink="/cliente/solicitacoes">Voltar às solicitações</a>
      @if (loading()) {
        <div class="skeleton" aria-busy="true">
          <span class="skeleton-line mid"></span>
          <span class="skeleton-block"></span>
        </div>
      } @else if (item(); as request) {
        <header class="page-head">
          <div>
            <p class="kicker">Solicitação</p>
            <h1>{{ request["categoryName"] }}</h1>
          </div>
          <span [class]="statusClass(request['status'])">{{ statusLabel(request["status"]) }}</span>
        </header>
        <div class="detail-layout">
          <article class="panel stack">
            <p>{{ request["description"] }}</p>
            <p class="meta">{{ request["neighborhood"] }}, {{ request["city"] }}</p>
            @if (request["acceptedPartnerName"]) {
              <p>Parceiro: {{ request["acceptedPartnerName"] }}</p>
            }
          </article>
          @if (request["status"] === "SEARCHING" || request["status"] === "ACCEPTED") {
            <aside class="detail-aside panel">
              <p class="panel-title">Ações</p>
              <div class="actions">
                <button class="btn btn-danger" type="button" (click)="cancel()" [disabled]="working()">
                  {{ working() ? "Cancelando…" : "Cancelar" }}
                </button>
              </div>
            </aside>
          }
        </div>
      }
    </section>
  `,
})
export class ClientRequestDetailPage {
  private readonly api = inject(ClientApiService);
  private readonly route = inject(ActivatedRoute);
  item = signal<Record<string, unknown> | null>(null);
  loading = signal(true);
  working = signal(false);
  readonly statusLabel = statusLabel;
  readonly statusClass = statusClass;

  constructor() {
    this.reload();
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get("id")!;
    this.loading.set(true);
    this.api.request(id).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  cancel(): void {
    const id = this.route.snapshot.paramMap.get("id")!;
    this.working.set(true);
    this.api.cancel(id).subscribe({
      next: () => {
        this.working.set(false);
        this.reload();
      },
      error: () => this.working.set(false),
    });
  }
}
