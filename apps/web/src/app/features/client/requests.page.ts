import { Component, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { statusClass, statusLabel } from "../../shared/ui/status";
import { ClientApiService } from "./client-api.service";

@Component({
  selector: "app-client-requests-page",
  imports: [RouterLink],
  template: `
    <section class="stack">
      <header class="page-head">
        <div>
          <p class="kicker">Acompanhamento</p>
          <h1>Minhas solicitações</h1>
          <p class="lede">Cada pedido, um ponto no atlas. Abra para ver o estado do campo.</p>
        </div>
        <a class="btn btn-primary" routerLink="/cliente/nova-solicitacao">Nova</a>
      </header>
      @if (loading()) {
        <div class="skeleton" aria-busy="true">
          <span class="skeleton-block"></span>
          <span class="skeleton-block"></span>
        </div>
      } @else if (items().length === 0) {
        <div class="empty">
          <strong>Nenhuma solicitação ainda</strong>
          <p>Abra um pedido e os parceiros perto de você entram no mapa.</p>
        </div>
      } @else {
        <div class="record-cards">
          @for (item of items(); track item["id"]) {
            <a class="list-card" [routerLink]="['/cliente/solicitacoes', item['id']]">
              <div class="list-card-top">
                <strong>{{ item["categoryName"] }}</strong>
                <span [class]="statusClass(item['status'])">{{ statusLabel(item["status"]) }}</span>
              </div>
              <p class="meta clamp">{{ item["description"] }}</p>
            </a>
          }
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item["id"]) {
                <tr>
                  <td>
                    <a class="row-link" [routerLink]="['/cliente/solicitacoes', item['id']]">
                      {{ item["categoryName"] }}
                    </a>
                  </td>
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
export class ClientRequestsPage {
  private readonly api = inject(ClientApiService);
  items = signal<Array<Record<string, unknown>>>([]);
  loading = signal(true);
  readonly statusLabel = statusLabel;
  readonly statusClass = statusClass;

  constructor() {
    this.api.requests().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
