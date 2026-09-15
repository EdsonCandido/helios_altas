import { Component, inject, signal } from "@angular/core";
import { ClientApiService } from "./client-api.service";

@Component({
  selector: "app-notifications-page",
  template: `
    <section class="stack">
      <header class="page-head">
        <div>
          <p class="kicker">Caixa</p>
          <h1>Notificações</h1>
        </div>
      </header>
      @if (loading()) {
        <div class="skeleton" aria-busy="true">
          <span class="skeleton-block"></span>
          <span class="skeleton-block"></span>
        </div>
      } @else if (items().length === 0) {
        <div class="empty">
          <strong>Nenhum aviso por agora</strong>
          <p>Quando um pedido mudar de estado, o recado aparece aqui.</p>
        </div>
      } @else {
        <div class="record-cards">
          @for (item of items(); track item["id"]) {
            <article class="list-card">
              <strong>{{ item["title"] }}</strong>
              <p class="meta">{{ item["body"] }}</p>
            </article>
          }
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Mensagem</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item["id"]) {
                <tr>
                  <td>{{ item["title"] }}</td>
                  <td>{{ item["body"] }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class NotificationsPage {
  private readonly api = inject(ClientApiService);
  items = signal<Array<Record<string, unknown>>>([]);
  loading = signal(true);

  constructor() {
    this.api.notifications().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
