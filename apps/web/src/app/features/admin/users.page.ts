import { Component, inject, signal } from "@angular/core";
import { roleLabel, statusClass, statusLabel } from "../../shared/ui/status";
import { AdminApiService } from "./admin-api.service";

@Component({
  selector: "app-admin-users-page",
  template: `
    <section class="stack">
      <header class="page-head">
        <div>
          <p class="kicker">Gestão</p>
          <h1>Usuários</h1>
        </div>
      </header>
      @if (loading()) {
        <div class="skeleton" aria-busy="true">
          <span class="skeleton-block"></span>
          <span class="skeleton-block"></span>
          <span class="skeleton-block"></span>
        </div>
      } @else if (users().length === 0) {
        <div class="empty">
          <strong>Nenhum usuário encontrado</strong>
          <p>Quando houver cadastros, a lista abre aqui.</p>
        </div>
      } @else {
        <div class="record-cards">
          @for (user of users(); track user["id"]) {
            <article class="list-card">
              <div class="list-card-top">
                <strong>{{ user["name"] }}</strong>
                <span [class]="statusClass(user['status'])">{{ statusLabel(user["status"]) }}</span>
              </div>
              <p class="meta">{{ user["email"] }} · {{ roleLabel(user["role"]) }}</p>
              <div class="row">
                <button class="btn btn-ghost btn-sm" type="button" (click)="setStatus(user, 'ACTIVE')">
                  Ativar
                </button>
                <button class="btn btn-ghost btn-sm" type="button" (click)="setStatus(user, 'INACTIVE')">
                  Desativar
                </button>
                <button class="btn btn-danger btn-sm" type="button" (click)="setStatus(user, 'BLOCKED')">
                  Bloquear
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
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user["id"]) {
                <tr>
                  <td>{{ user["name"] }}</td>
                  <td>{{ user["email"] }}</td>
                  <td>{{ roleLabel(user["role"]) }}</td>
                  <td>
                    <span [class]="statusClass(user['status'])">{{ statusLabel(user["status"]) }}</span>
                  </td>
                  <td>
                    <div class="row">
                      <button class="btn btn-ghost btn-sm" type="button" (click)="setStatus(user, 'ACTIVE')">
                        Ativar
                      </button>
                      <button class="btn btn-ghost btn-sm" type="button" (click)="setStatus(user, 'INACTIVE')">
                        Desativar
                      </button>
                      <button class="btn btn-danger btn-sm" type="button" (click)="setStatus(user, 'BLOCKED')">
                        Bloquear
                      </button>
                    </div>
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
export class AdminUsersPage {
  private readonly api = inject(AdminApiService);
  users = signal<Array<Record<string, unknown>>>([]);
  loading = signal(true);
  readonly statusLabel = statusLabel;
  readonly statusClass = statusClass;
  readonly roleLabel = roleLabel;

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.api.users({ page: 1, pageSize: 50 }).subscribe({
      next: (result) => {
        this.users.set(result.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setStatus(user: Record<string, unknown>, status: "ACTIVE" | "INACTIVE" | "BLOCKED"): void {
    this.api.updateUser(String(user["id"]), { status }).subscribe(() => this.reload());
  }
}
