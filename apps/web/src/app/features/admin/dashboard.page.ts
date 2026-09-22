import { Component, inject, signal } from "@angular/core";
import { AdminApiService } from "./admin-api.service";

@Component({
  selector: "app-admin-dashboard-page",
  template: `
    <section class="stack">
      <header class="page-head">
        <div>
          <p class="kicker">Operação</p>
          <h1>Painel operacional</h1>
          <p class="lede">Leitura viva do campo: volume, fila e desfecho das solicitações.</p>
        </div>
      </header>
      @if (loading()) {
        <div class="metrics" aria-busy="true">
          @for (key of keys; track key) {
            <div class="metric">
              <span class="skeleton-line mid"></span>
              <span class="skeleton-line" style="margin-top: 12px"></span>
            </div>
          }
        </div>
      } @else {
        <div class="metrics">
          @for (key of keys; track key) {
            <article class="metric">
              <span class="metric-value">{{ indicators()[key] ?? 0 }}</span>
              <span class="metric-label">{{ labels[key] }}</span>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class AdminDashboardPage {
  private readonly api = inject(AdminApiService);
  indicators = signal<Record<string, number>>({});
  loading = signal(true);
  keys = ["total", "searching", "accepted", "inProgress", "completed", "cancelled", "expired"];
  labels: Record<string, string> = {
    total: "Total",
    searching: "Buscando",
    accepted: "Aceitas",
    inProgress: "Em andamento",
    completed: "Concluídas",
    cancelled: "Canceladas",
    expired: "Expiradas",
  };

  constructor() {
    this.api.indicators().subscribe({
      next: (items) => {
        this.indicators.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
