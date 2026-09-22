import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { statusClass, statusLabel } from "../../shared/ui/status";
import { AdminApiService } from "./admin-api.service";

@Component({
  selector: "app-admin-requests-page",
  imports: [FormsModule],
  template: `
    <section class="stack">
      <header class="page-head">
        <div>
          <p class="kicker">Operação</p>
          <h1>Solicitações</h1>
          <p class="lede">Varredura do fluxo: do primeiro pedido ao desfecho no mapa.</p>
        </div>
      </header>
      <form class="toolbar" (ngSubmit)="load()">
        <label class="field">
          Status
          <select name="status" [(ngModel)]="status">
            <option value="">Todos</option>
            <option value="PENDING">Pendente</option>
            <option value="SEARCHING">Buscando</option>
            <option value="ACCEPTED">Aceita</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="COMPLETED">Concluída</option>
            <option value="CANCELLED">Cancelada</option>
            <option value="EXPIRED">Expirada</option>
          </select>
        </label>
        <button class="btn btn-primary" type="submit">Filtrar</button>
      </form>
      @if (loading()) {
        <div class="skeleton" aria-busy="true">
          <span class="skeleton-block"></span>
          <span class="skeleton-block"></span>
          <span class="skeleton-block"></span>
        </div>
      } @else if (items().length === 0) {
        <div class="empty">
          <strong>Nenhuma solicitação neste filtro</strong>
          <p>Ajuste o status ou aguarde novos pedidos no mapa.</p>
        </div>
      } @else {
        <div class="record-cards">
          @for (item of items(); track item["id"]) {
            <article class="list-card">
              <div class="list-card-top">
                <strong>{{ item["categoryName"] }}</strong>
                <span [class]="statusClass(item['status'])">{{ statusLabel(item["status"]) }}</span>
              </div>
              <p class="meta">{{ item["city"] }}</p>
              <p class="meta clamp">{{ item["description"] }}</p>
            </article>
          }
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Cidade</th>
                <th>Descrição</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item["id"]) {
                <tr>
                  <td>{{ item["categoryName"] }}</td>
                  <td>{{ item["city"] }}</td>
                  <td class="clamp">{{ item["description"] }}</td>
                  <td>
                    <span [class]="statusClass(item['status'])">{{ statusLabel(item["status"]) }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class AdminRequestsPage {
  private readonly api = inject(AdminApiService);
  items = signal<Array<Record<string, unknown>>>([]);
  loading = signal(true);
  status = "";
  readonly statusLabel = statusLabel;
  readonly statusClass = statusClass;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.requests({ status: this.status || undefined }).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
