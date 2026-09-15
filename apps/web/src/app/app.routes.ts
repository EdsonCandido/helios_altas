import { Routes } from "@angular/router";
import { authGuard, roleGuard } from "./core/auth/auth.guard";
import { LoginPage } from "./features/auth/login.page";
import { RegisterPage } from "./features/auth/register.page";
import { AppShellComponent } from "./layouts/app-shell.component";

export const routes: Routes = [
  { path: "login", component: LoginPage },
  { path: "cadastro", component: RegisterPage },
  {
    path: "",
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: "", pathMatch: "full", redirectTo: "cliente" },
      {
        path: "cliente",
        canActivate: [roleGuard("CLIENT")],
        children: [
          {
            path: "",
            loadComponent: () => import("./features/client/search.page").then((m) => m.SearchPage),
          },
          {
            path: "parceiros/:id",
            loadComponent: () =>
              import("./features/client/partner-profile.page").then((m) => m.PartnerProfilePage),
          },
          {
            path: "nova-solicitacao",
            loadComponent: () => import("./features/client/new-request.page").then((m) => m.NewRequestPage),
          },
          {
            path: "solicitacoes",
            loadComponent: () =>
              import("./features/client/requests.page").then((m) => m.ClientRequestsPage),
          },
          {
            path: "solicitacoes/:id",
            loadComponent: () =>
              import("./features/client/request-detail.page").then((m) => m.ClientRequestDetailPage),
          },
          {
            path: "notificacoes",
            loadComponent: () =>
              import("./features/client/notifications.page").then((m) => m.NotificationsPage),
          },
          {
            path: "perfil",
            loadComponent: () => import("./features/client/profile.page").then((m) => m.ClientProfilePage),
          },
        ],
      },
      {
        path: "parceiro",
        canActivate: [roleGuard("PARTNER")],
        children: [
          {
            path: "",
            loadComponent: () => import("./features/partner/inbox.page").then((m) => m.PartnerInboxPage),
          },
          {
            path: "solicitacoes",
            loadComponent: () => import("./features/partner/inbox.page").then((m) => m.PartnerInboxPage),
          },
          {
            path: "solicitacoes/:id",
            loadComponent: () =>
              import("./features/partner/request-detail.page").then((m) => m.PartnerRequestDetailPage),
          },
          {
            path: "historico",
            loadComponent: () => import("./features/partner/history.page").then((m) => m.PartnerHistoryPage),
          },
          {
            path: "perfil",
            loadComponent: () => import("./features/partner/profile.page").then((m) => m.PartnerProfilePage),
          },
        ],
      },
      {
        path: "admin",
        canActivate: [roleGuard("ADMIN")],
        children: [
          {
            path: "",
            loadComponent: () => import("./features/admin/dashboard.page").then((m) => m.AdminDashboardPage),
          },
          {
            path: "usuarios",
            loadComponent: () => import("./features/admin/users.page").then((m) => m.AdminUsersPage),
          },
          {
            path: "categorias",
            loadComponent: () =>
              import("./features/admin/categories.page").then((m) => m.AdminCategoriesPage),
          },
          {
            path: "solicitacoes",
            loadComponent: () => import("./features/admin/requests.page").then((m) => m.AdminRequestsPage),
          },
          {
            path: "mapas",
            loadComponent: () => import("./features/admin/maps.page").then((m) => m.AdminMapsPage),
          },
        ],
      },
    ],
  },
];
