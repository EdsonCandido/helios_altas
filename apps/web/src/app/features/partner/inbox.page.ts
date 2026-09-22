import { Component, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
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
          <p class="lede">Convites da vizinhança. Abra o pedido e decida no campo.</p>
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
          @for (item of items(); track itemId(item)) {
            <article class="list-card panel" role="link" tabindex="0" (click)="open(item)" (keydown.enter)="open(item)">
              <div class="list-card-top">
                <strong>{{ item["categoryName"] }}</strong>
                <span [class]="statusClass(item['inviteStatus'] ?? item['status'])">
                  {{ statusLabel(item["inviteStatus"] ?? item["status"]) }}
                </span>
              </div>
              <p class="meta">{{ item["city"] }}</p>
              <p class="meta clamp">{{ item["description"] }}</p>
              <div class="actions">
                <a
                  class="btn btn-primary"
                  [routerLink]="['/parceiro/solicitacoes', itemId(item)]"
                  (click)="$event.stopPropagation()"
                >
                  Abrir
                </a>
              </div>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track itemId(item)) {
                <tr class="clickable-row" (click)="open(item)">
                  <td>{{ item["categoryName"] }}</td>
                  <td>{{ item["city"] }}</td>
                  <td class="clamp">{{ item["description"] }}</td>
                  <td>
                    <span [class]="statusClass(item['inviteStatus'] ?? item['status'])">
                      {{ statusLabel(item["inviteStatus"] ?? item["status"]) }}
                    </span>
                  </td>
                  <td>
                    <a
                      class="btn btn-ghost btn-sm"
                      [routerLink]="['/parceiro/solicitacoes', itemId(item)]"
                      (click)="$event.stopPropagation()"
                    >
                      Abrir
                    </a>
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
  private readonly router = inject(Router);
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

  itemId(item: Record<string, unknown>): string {
    return String(item["id"] ?? "");
  }

  open(item: Record<string, unknown>): void {
    const id = this.itemId(item);
    if (!id) {
      return;
    }
    void this.router.navigate(["/parceiro/solicitacoes", id]);
  }
}
