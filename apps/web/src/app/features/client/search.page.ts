import { CurrencyPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ClientApiService } from "./client-api.service";

@Component({
  selector: "app-search-page",
  imports: [FormsModule, RouterLink, CurrencyPipe],
  template: `
    <section class="stack">
      <header class="page-head">
        <div>
          <p class="kicker">Perto de você</p>
          <h1>Buscar parceiros</h1>
          <p class="lede">Marque o ponto. O atlas devolve quem atende no raio da sua rua.</p>
        </div>
      </header>
      <form class="toolbar" (ngSubmit)="search()">
        <label class="field">
          Categoria
          <select name="categoryId" [(ngModel)]="categoryId">
            <option value="">Todas</option>
            @for (category of categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
        </label>
        <button class="btn btn-primary" type="submit" [disabled]="searching()">
          {{ searching() ? "Buscando…" : "Usar minha localização" }}
        </button>
      </form>
      @if (searching()) {
        <div class="result-grid" aria-busy="true">
          <span class="skeleton-block"></span>
          <span class="skeleton-block"></span>
          <span class="skeleton-block"></span>
        </div>
      } @else if (partners().length === 0) {
        <div class="empty">
          <strong>Nenhum parceiro por aqui ainda</strong>
          <p>Escolha uma categoria e use sua localização para abrir o mapa.</p>
        </div>
      } @else {
        <div class="result-grid">
          @for (partner of partners(); track partner.id + ':' + partner.categoryId) {
            <a class="list-card" [routerLink]="['/cliente/parceiros', partner.id]">
              <div class="list-card-top">
                <strong>{{ partner.name }}</strong>
                <span
                  class="status"
                  [class.status-success]="partner.isAvailable"
                  [class.status-neutral]="!partner.isAvailable"
                >
                  {{ partner.isAvailable ? "Disponível" : "Indisponível" }}
                </span>
              </div>
              <p class="meta">{{ partner.category }} · {{ (partner.distanceMeters / 1000).toFixed(1) }} km</p>
              <p class="meta">Visita mínima {{ partner.minimumVisitFeeCents / 100 | currency: "BRL" }}</p>
            </a>
          }
        </div>
      }
    </section>
  `,
})
export class SearchPage {
  private readonly api = inject(ClientApiService);
  categories = signal<Array<{ id: string; name: string; slug: string }>>([]);
  partners = signal<
    Array<{
      id: string;
      name: string;
      category: string;
      categoryId: string;
      distanceMeters: number;
      minimumVisitFeeCents: number;
      isAvailable: boolean;
    }>
  >([]);
  categoryId = "";
  searching = signal(false);

  constructor() {
    this.api.categories().subscribe((items) => this.categories.set(items));
  }

  search(): void {
    this.searching.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.api
          .nearby({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            categoryId: this.categoryId || undefined,
          })
          .subscribe({
            next: (items) => {
              this.partners.set(items);
              this.searching.set(false);
            },
            error: () => {
              this.searching.set(false);
            },
          });
      },
      () => {
        this.searching.set(false);
      },
    );
  }
}
