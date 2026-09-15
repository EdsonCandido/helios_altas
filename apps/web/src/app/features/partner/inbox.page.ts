import { Component, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { statusClass, statusLabel } from "../../shared/ui/status";
import { PartnerApiService } from "./partner-api.service";

@Component({
  selector: "app-partner-inbox-page",
  imports: [RouterLink],
  template: `
    <section class="stack">
      <header class="page-head">
        <div>
          <p class="kicker">Caixa</p>
          <h1>Solicitações recebidas</h1>
        </div>
      </header>
      @if (loading()) {
        <div class="skeleton" aria-busy="true">
          <span class="skeleton-block"></span>
          <span class="skeleton-block"></span>
        </div>
      } @else if (items().length === 0) {
        <div class="empty">
          <strong>Caixa vazia</strong>
          <p>Pedidos novos de clientes perto de você aparecem aqui.</p>
        </div>
      } @else {
        <div class="record-cards">
          @for (item of items(); track item["id"]) {
            <a class="list-card" [routerLink]="['/parceiro/solicitacoes', item['id']]">
              <div class="list-card-top">
                <strong>{{ item["categoryName"] }}</strong>
                <span [class]="statusClass(item['inviteStatus'] ?? item['status'])">
                  {{ statusLabel(item["inviteStatus"] ?? item["status"]) }}
                </span>
              </div>
              <p class="meta">{{ item["city"] }}</p>
              <p class="meta clamp">{{ item["description"] }}</p>
            </a>
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
                  <td>
                    <a class="row-link" [routerLink]="['/parceiro/solicitacoes', item['id']]">
                      {{ item["categoryName"] }}
                    </a>
                  </td>
                  <td>{{ item["city"] }}</td>
                  <td class="clamp">{{ item["description"] }}</td>
                  <td>
                    <span [class]="statusClass(item['inviteStatus'] ?? item['status'])">
                      {{ statusLabel(item["inviteStatus"] ?? item["status"]) }}
                    </span>
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
export class PartnerInboxPage {
  private readonly api = inject(PartnerApiService);
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
