import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MapComponent } from "../../shared/map/map.component";
import { AdminApiService } from "./admin-api.service";
import { ClientApiService } from "../client/client-api.service";

@Component({
  selector: "app-admin-maps-page",
  imports: [FormsModule, MapComponent],
  template: `
    <section class="stack">
      <header class="page-head">
        <div>
          <p class="kicker">Território</p>
          <h1>Mapas administrativos</h1>
          <p class="lede">Dois recortes do mesmo solo: quem atende e onde a demanda se acumula.</p>
        </div>
      </header>
      <form class="toolbar" (ngSubmit)="load()">
        <label class="field">
          Categoria
          <select name="categoryId" [(ngModel)]="categoryId">
            <option value="">Todas</option>
            @for (category of categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
        </label>
        <label class="field">
          Status
          <select name="status" [(ngModel)]="status">
            <option value="">Todos</option>
            <option value="SEARCHING">Buscando</option>
            <option value="ACCEPTED">Aceita</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="COMPLETED">Concluída</option>
          </select>
        </label>
        <button class="btn btn-primary" type="submit">Filtrar</button>
      </form>
      <div class="maps-grid">
        <section class="panel stack">
          <h2>Parceiros</h2>
          <app-map [markers]="partnerMarkers()" [cluster]="true" label="Mapa de parceiros" />
        </section>
        <section class="panel stack">
          <h2>Concentração de solicitações</h2>
          <app-map [markers]="clusterMarkers()" [cluster]="true" label="Mapa de solicitações" />
        </section>
      </div>
    </section>
  `,
})
export class AdminMapsPage {
  private readonly api = inject(AdminApiService);
  private readonly categoriesApi = inject(ClientApiService);
  categories = signal<Array<{ id: string; name: string }>>([]);
  partnerMarkers = signal<Array<{ lat: number; lng: number; label: string }>>([]);
  clusterMarkers = signal<Array<{ lat: number; lng: number; label: string }>>([]);
  categoryId = "";
  status = "";

  constructor() {
    this.categoriesApi.categories().subscribe((items) => this.categories.set(items));
    this.load();
  }

  load(): void {
    this.api
      .partnersMap({ categoryId: this.categoryId || undefined })
      .subscribe((items) =>
        this.partnerMarkers.set(
          items
            .filter((item) => item["latitude"] && item["longitude"])
            .map((item) => ({
              lat: Number(item["latitude"]),
              lng: Number(item["longitude"]),
              label: `${item["name"]} · ${item["isAvailable"] ? "disponível" : "indisponível"}`,
            })),
        ),
      );

    this.api
      .clusters({
        categoryId: this.categoryId || undefined,
        status: this.status || undefined,
      })
      .subscribe((items) =>
        this.clusterMarkers.set(
          items.map((item) => ({
            lat: item.latitude,
            lng: item.longitude,
            label: `${item.count} solicitações`,
          })),
        ),
      );
  }
}
