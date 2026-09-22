import { CurrencyPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { ClientApiService } from "./client-api.service";

@Component({
  selector: "app-partner-profile-page",
  imports: [CurrencyPipe, RouterLink],
  template: `
    <section class="stack">
      <a class="link-quiet" routerLink="/cliente">Voltar à busca</a>
      @if (loading()) {
        <div class="skeleton" aria-busy="true">
          <span class="skeleton-line mid"></span>
          <span class="skeleton-block"></span>
        </div>
      } @else if (partner(); as item) {
        <header class="page-head">
          <div>
            <p class="kicker">Parceiro</p>
            <h1>{{ item["name"] }}</h1>
            <p class="lede">{{ item["neighborhood"] }}, {{ item["city"] }}</p>
          </div>
        </header>
        <div class="detail-layout">
          <article class="panel stack">
            <p>{{ item["description"] }}</p>
            @if (item["distanceMeters"]) {
              <p class="meta">Distância aproximada: {{ (Number(item["distanceMeters"]) / 1000).toFixed(1) }} km</p>
            }
            @for (service of services(); track service.categoryId) {
              <p class="meta">
                {{ service.categoryName }} · {{ service.minimumVisitFeeCents / 100 | currency: "BRL" }}
              </p>
            }
          </article>
          <aside class="detail-aside panel">
            <p class="panel-title">Pedido</p>
            <a class="btn btn-primary" routerLink="/cliente/nova-solicitacao">Criar solicitação</a>
          </aside>
        </div>
      }
    </section>
  `,
})
export class PartnerProfilePage {
  private readonly api = inject(ClientApiService);
  private readonly route = inject(ActivatedRoute);
  partner = signal<Record<string, unknown> | null>(null);
  services = signal<Array<{ categoryId: string; categoryName: string; minimumVisitFeeCents: number }>>([]);
  loading = signal(true);
  readonly Number = Number;

  constructor() {
    const id = this.route.snapshot.paramMap.get("id")!;
    this.api.partner(id).subscribe({
      next: (item) => {
        this.partner.set(item);
        this.services.set(
          (item["services"] as Array<{
            categoryId: string;
            categoryName: string;
            minimumVisitFeeCents: number;
          }>) ?? [],
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
