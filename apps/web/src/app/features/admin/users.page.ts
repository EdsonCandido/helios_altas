import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ModalComponent } from "../../shared/ui/modal.component";
import { roleLabel, statusClass, statusLabel } from "../../shared/ui/status";
import { AdminApiService } from "./admin-api.service";

type UserRole = "CLIENT" | "PARTNER" | "ADMIN";
type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

@Component({
  selector: "app-admin-users-page",
  imports: [FormsModule, ModalComponent],
  template: `
    <section class="stack">
      <header class="page-head">
        <div>
          <p class="kicker">Gestão</p>
          <h1>Usuários</h1>
          <p class="lede">Filtre o campo, edite cadastro e ajuste status sem sair da lista.</p>
        </div>
      </header>
      <form class="toolbar" (ngSubmit)="handleFilter()">
        <label class="field">
          Busca
          <input name="query" [(ngModel)]="query" placeholder="Nome ou e-mail" />
        </label>
        <label class="field">
          Perfil
          <select name="role" [(ngModel)]="role">
            <option value="">Todos</option>
            <option value="CLIENT">Cliente</option>
            <option value="PARTNER">Parceiro</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </label>
        <label class="field">
          Status
          <select name="status" [(ngModel)]="status">
            <option value="">Todos</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="BLOCKED">Bloqueado</option>
          </select>
        </label>
        <button class="btn btn-primary" type="submit">Filtrar</button>
      </form>
      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }
      @if (notice()) {
        <div class="alert alert-ok" role="status">{{ notice() }}</div>
      }
      @if (loading()) {
        <div class="skeleton" aria-busy="true">
          <span class="skeleton-block"></span>
          <span class="skeleton-block"></span>
          <span class="skeleton-block"></span>
        </div>
      } @else if (users().length === 0) {
        <div class="empty">
          <strong>Nenhum usuário encontrado</strong>
          <p>Ajuste a busca ou aguarde novos cadastros.</p>
        </div>
      } @else {
        <div class="record-cards">
          @for (user of users(); track user["id"]) {
            <article class="list-card">
              <div class="list-card-top">
                <strong>{{ user["name"] }}</strong>
                <span [class]="statusClass(user['status'])">{{ statusLabel(user["status"]) }}</span>
              </div>
              <p class="meta">{{ user["email"] }} · {{ user["phone"] }} · {{ roleLabel(user["role"]) }}</p>
              <div class="row">
                <button class="btn btn-ghost btn-sm" type="button" (click)="handleEdit(user)">Editar</button>
                <button class="btn btn-ghost btn-sm" type="button" (click)="handleSetStatus(user, 'ACTIVE')">
                  Ativar
                </button>
                <button class="btn btn-ghost btn-sm" type="button" (click)="handleSetStatus(user, 'INACTIVE')">
                  Desativar
                </button>
                <button class="btn btn-danger btn-sm" type="button" (click)="handleSetStatus(user, 'BLOCKED')">
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
                <th>Telefone</th>
                <th>Perfil</th>
                <th>Status</th>
                <th class="col-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user["id"]) {
                <tr>
                  <td>{{ user["name"] }}</td>
                  <td>{{ user["email"] }}</td>
                  <td>{{ user["phone"] }}</td>
                  <td>{{ roleLabel(user["role"]) }}</td>
                  <td>
                    <span [class]="statusClass(user['status'])">{{ statusLabel(user["status"]) }}</span>
                  </td>
                  <td class="col-actions">
                    <div class="row">
                      <button class="btn btn-ghost btn-sm" type="button" (click)="handleEdit(user)">Editar</button>
                      <button class="btn btn-ghost btn-sm" type="button" (click)="handleSetStatus(user, 'ACTIVE')">
                        Ativar
                      </button>
                      <button class="btn btn-ghost btn-sm" type="button" (click)="handleSetStatus(user, 'INACTIVE')">
                        Desativar
                      </button>
                      <button class="btn btn-danger btn-sm" type="button" (click)="handleSetStatus(user, 'BLOCKED')">
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

    <app-modal
      [open]="editingUser() !== null"
      title="Editar usuário"
      kicker="Cadastro"
      (closed)="handleCancelEdit()"
    >
      @if (editingUser(); as user) {
        <form class="stack" (ngSubmit)="handleSaveUser()">
          <p class="meta">{{ user["name"] }} · {{ user["email"] }}</p>
          <div class="form-grid">
            <label class="field">
              Nome
              <input name="editName" [(ngModel)]="editName" required />
            </label>
            <label class="field">
              E-mail
              <input name="editEmail" type="email" [(ngModel)]="editEmail" required />
            </label>
            <label class="field">
              Telefone
              <input name="editPhone" [(ngModel)]="editPhone" required />
            </label>
            <label class="field">
              Perfil
              <select name="editRole" [(ngModel)]="editRole">
                <option value="CLIENT">Cliente</option>
                <option value="PARTNER">Parceiro</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>
            <label class="field">
              Status
              <select name="editStatus" [(ngModel)]="editStatus">
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
                <option value="BLOCKED">Bloqueado</option>
              </select>
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" type="submit" [disabled]="saving()">
              {{ saving() ? "Salvando…" : "Salvar" }}
            </button>
            <button class="btn btn-ghost" type="button" (click)="handleCancelEdit()">Cancelar</button>
          </div>
        </form>
      }
    </app-modal>

  `,
})
export class AdminUsersPage {
  private readonly api = inject(AdminApiService);
  users = signal<Array<Record<string, unknown>>>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal("");
  notice = signal("");
  editingUser = signal<Record<string, unknown> | null>(null);
  readonly statusLabel = statusLabel;
  readonly statusClass = statusClass;
  readonly roleLabel = roleLabel;

  query = "";
  role = "";
  status = "";
  editName = "";
  editEmail = "";
  editPhone = "";
  editRole: UserRole = "CLIENT";
  editStatus: UserStatus = "ACTIVE";

  constructor() {
    this.reload();
  }

  handleFilter(): void {
    this.reload();
  }

  handleEdit(user: Record<string, unknown>): void {
    this.clearMessages();
    this.editingUser.set(user);
    this.editName = String(user["name"] ?? "");
    this.editEmail = String(user["email"] ?? "");
    this.editPhone = String(user["phone"] ?? "");
    this.editRole = (user["role"] as UserRole) ?? "CLIENT";
    this.editStatus = (user["status"] as UserStatus) ?? "ACTIVE";
  }

  handleCancelEdit(): void {
    this.editingUser.set(null);
  }

  handleSaveUser(): void {
    const user = this.editingUser();
    if (!user) {
      return;
    }

    this.clearMessages();
    this.saving.set(true);
    this.api
      .updateUser(String(user["id"]), {
        name: this.editName,
        email: this.editEmail,
        phone: this.editPhone,
        role: this.editRole,
        status: this.editStatus,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editingUser.set(null);
          this.notice.set("Dados do usuário atualizados.");
          this.reload();
        },
        error: () => {
          this.saving.set(false);
          this.error.set("Não foi possível salvar os dados do usuário.");
        },
      });
  }

  handleSetStatus(user: Record<string, unknown>, status: UserStatus): void {
    this.clearMessages();
    this.api.updateUser(String(user["id"]), { status }).subscribe({
      next: () => this.reload(),
      error: () => this.error.set("Não foi possível alterar o status do usuário."),
    });
  }

  reload(): void {
    this.loading.set(true);
    this.api
      .users({
        query: this.query || undefined,
        role: this.role || undefined,
        status: this.status || undefined,
        page: 1,
        pageSize: 50,
      })
      .subscribe({
        next: (result) => {
          this.users.set(result.items);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set("Não foi possível carregar os usuários.");
        },
      });
  }

  private clearMessages(): void {
    this.error.set("");
    this.notice.set("");
  }
}
