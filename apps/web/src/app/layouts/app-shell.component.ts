import { Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthStore } from "../core/auth/auth.store";
import { roleLabel } from "../shared/ui/status";

type NavItem = {
  path: string;
  label: string;
  icon: string;
};

@Component({
  selector: "app-shell",
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <header class="masthead">
        <a class="brand" routerLink="/">
          <svg class="brand-mark" viewBox="0 0 28 28" aria-hidden="true">
            <circle cx="14" cy="14" r="6" fill="currentColor" />
            <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" stroke-width="1.4" />
          </svg>
          Helios Altas
        </a>
        <div class="masthead-end">
          @if (auth.user(); as user) {
            <div class="user-chip">
              <strong>{{ user.name }}</strong>
              <span>{{ roleLabel(user.role) }}</span>
            </div>
          }
          <button class="btn btn-ghost btn-sm" type="button" (click)="logout()">Sair</button>
        </div>
      </header>
      <nav class="nav-rail" aria-label="Navegação principal">
        <a class="brand" routerLink="/">
          <svg class="brand-mark" viewBox="0 0 28 28" aria-hidden="true">
            <circle cx="14" cy="14" r="6" fill="currentColor" />
            <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" stroke-width="1.4" />
          </svg>
          Helios Altas
        </a>
        @for (item of items; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.path.split('/').length <= 2 }"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path [attr.d]="item.icon" />
            </svg>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
      <main class="page">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppShellComponent {
  readonly auth = inject(AuthStore);
  readonly roleLabel = roleLabel;
  readonly role = this.auth.role;

  get items(): NavItem[] {
    if (this.role() === "ADMIN") {
      return [
        { path: "/admin", label: "Painel", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
        {
          path: "/admin/usuarios",
          label: "Usuários",
          icon: "M16 19v-1.2A3.8 3.8 0 0 0 12.2 14H7.8A3.8 3.8 0 0 0 4 17.8V19M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M19 19v-1.4A3.6 3.6 0 0 0 17 14.2",
        },
        { path: "/admin/solicitacoes", label: "Solicitações", icon: "M7 4h10v16H7zM10 8h4M10 12h4M10 16h3" },
        {
          path: "/admin/categorias",
          label: "Categorias",
          icon: "M20 13.2 12.8 20a2 2 0 0 1-2.8 0L4 14V4h10l6 6v3.2ZM9 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
        },
        {
          path: "/admin/mapas",
          label: "Mapas",
          icon: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
        },
      ];
    }
    if (this.role() === "PARTNER") {
      return [
        { path: "/parceiro", label: "Início", icon: "M4 11.5 12 4l8 7.5V20H4zM9 20v-6h6v6" },
        { path: "/parceiro/solicitacoes", label: "Pedidos", icon: "M7 4h10v16H7zM10 8h4M10 12h4M10 16h3" },
        { path: "/parceiro/historico", label: "Histórico", icon: "M12 7v5l3 2M12 21a9 9 0 1 0-9-9" },
        { path: "/parceiro/perfil", label: "Perfil", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0" },
      ];
    }
    return [
      { path: "/cliente", label: "Buscar", icon: "M11 5a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm5.5 10.5L20 19" },
      { path: "/cliente/solicitacoes", label: "Pedidos", icon: "M7 4h10v16H7zM10 8h4M10 12h4M10 16h3" },
      { path: "/cliente/notificacoes", label: "Avisos", icon: "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Zm4 11a2 2 0 0 0 4 0" },
      { path: "/cliente/perfil", label: "Perfil", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0" },
    ];
  }

  logout(): void {
    void this.auth.logout();
  }
}
