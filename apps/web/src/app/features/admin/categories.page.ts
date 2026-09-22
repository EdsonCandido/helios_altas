import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AdminApiService } from "./admin-api.service";

@Component({
  selector: "app-admin-categories-page",
  imports: [FormsModule],
  template: `
    <section class="stack">
      <header class="page-head">
        <div>
          <p class="kicker">Catálogo</p>
          <h1>Categorias</h1>
          <p class="lede">Nomeie o território de serviço. Ative só o que entra no mapa.</p>
        </div>
      </header>
      <form class="toolbar" (ngSubmit)="create()">
        <label class="field">Nome <input name="name" [(ngModel)]="name" required /></label>
        <label class="field">Slug <input name="slug" [(ngModel)]="slug" required /></label>
        <button class="btn btn-primary" type="submit" [disabled]="creating()">
          {{ creating() ? "Criando…" : "Criar" }}
        </button>
      </form>
      @if (loading()) {
        <div class="skeleton" aria-busy="true">
          <span class="skeleton-block"></span>
          <span class="skeleton-block"></span>
        </div>
      } @else if (items().length === 0) {
        <div class="empty">
          <strong>Nenhuma categoria</strong>
          <p>Crie a primeira para os clientes começarem a buscar.</p>
        </div>
      } @else {
        <div class="record-cards">
          @for (item of items(); track item["id"]) {
            <article class="list-card">
              <div class="list-card-top">
                <strong>{{ item["name"] }}</strong>
                <span
                  class="status"
                  [class.status-success]="item['isActive']"
                  [class.status-neutral]="!item['isActive']"
                >
                  {{ item["isActive"] ? "Ativa" : "Inativa" }}
                </span>
              </div>
              <p class="meta mono">{{ item["slug"] }}</p>
              <div class="row">
                <button class="btn btn-ghost btn-sm" type="button" (click)="toggle(item)">
                  {{ item["isActive"] ? "Desativar" : "Ativar" }}
                </button>
              </div>
            </article>
          }
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Slug</th>
                <th>Status</th>
                <th class="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item["id"]) {
                <tr>
                  <td>{{ item["name"] }}</td>
                  <td class="mono">{{ item["slug"] }}</td>
                  <td>
                    <span
                      class="status"
                      [class.status-success]="item['isActive']"
                      [class.status-neutral]="!item['isActive']"
                    >
                      {{ item["isActive"] ? "Ativa" : "Inativa" }}
                    </span>
                  </td>
                  <td class="col-actions">
                    <button class="btn btn-ghost btn-sm" type="button" (click)="toggle(item)">
                      {{ item["isActive"] ? "Desativar" : "Ativar" }}
                    </button>
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
export class AdminCategoriesPage {
  private readonly api = inject(AdminApiService);
  items = signal<Array<Record<string, unknown>>>([]);
  loading = signal(true);
  creating = signal(false);
  name = "";
  slug = "";

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.api.categories().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    this.creating.set(true);
    this.api.createCategory({ name: this.name, slug: this.slug }).subscribe({
      next: () => {
        this.name = "";
        this.slug = "";
        this.creating.set(false);
        this.reload();
      },
      error: () => this.creating.set(false),
    });
  }

  toggle(item: Record<string, unknown>): void {
    this.api.updateCategory(String(item["id"]), { isActive: !item["isActive"] }).subscribe(() => this.reload());
  }
}
