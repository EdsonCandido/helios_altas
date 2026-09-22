import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ClientApiService } from "../client/client-api.service";
import { MapComponent } from "../../shared/map/map.component";
import { PartnerApiService } from "./partner-api.service";

@Component({
  selector: "app-partner-profile-page",
  imports: [FormsModule, MapComponent],
  template: `
    <section class="stack">
      <header class="page-head">
        <div>
          <p class="kicker">Base</p>
          <h1>Perfil do parceiro</h1>
          <p class="lede">Sua âncora no território: raio, serviços e disponibilidade.</p>
        </div>
      </header>
      @if (loading()) {
        <div class="skeleton" aria-busy="true">
          <span class="skeleton-block"></span>
          <span class="skeleton-block"></span>
        </div>
      } @else {
        <form class="split" (ngSubmit)="save()">
          <div class="panel stack">
            <label class="field">
              Descrição
              <textarea name="description" [(ngModel)]="description"></textarea>
            </label>
            <div class="form-grid">
              <label class="field span-2">Endereço <input name="address" [(ngModel)]="address" /></label>
              <label class="field">Bairro <input name="neighborhood" [(ngModel)]="neighborhood" /></label>
              <label class="field">Cidade <input name="city" [(ngModel)]="city" /></label>
              <label class="field">UF <input name="state" [(ngModel)]="state" maxlength="2" /></label>
              <label class="field">
                Raio (m)
                <input name="radius" type="number" [(ngModel)]="serviceRadiusMeters" />
              </label>
            </div>
            <label class="check">
              <input type="checkbox" name="available" [(ngModel)]="isAvailable" />
              Disponível
            </label>
            <fieldset>
              <legend>Serviços</legend>
              <div class="check-grid">
                @for (category of categories(); track category.id) {
                  <label>
                    <input type="checkbox" [checked]="selected.has(category.id)" (change)="toggle(category.id)" />
                    {{ category.name }}
                  </label>
                }
              </div>
            </fieldset>
            <div class="actions">
              <button class="btn btn-primary" type="submit" [disabled]="saving()">
                {{ saving() ? "Salvando…" : "Salvar" }}
              </button>
            </div>
            @if (saved()) {
              <p class="status status-success">Perfil atualizado</p>
            }
          </div>
          <div class="panel stack">
            <p class="panel-title">Base de atendimento</p>
            <app-map
              [center]="[latitude || -23.55, longitude || -46.63]"
              [markers]="markers"
              [clickable]="true"
              (pick)="pick($event.lat, $event.lng)"
            />
          </div>
        </form>
      }
    </section>
  `,
})
export class PartnerProfilePage {
  private readonly api = inject(PartnerApiService);
  private readonly categoriesApi = inject(ClientApiService);
  description = "";
  address = "";
  neighborhood = "";
  city = "";
  state = "";
  latitude = 0;
  longitude = 0;
  serviceRadiusMeters = 5000;
  isAvailable = false;
  selected = new Set<string>();
  categories = signal<Array<{ id: string; name: string }>>([]);
  markers: Array<{ lat: number; lng: number; label: string }> = [];
  saved = signal(false);
  loading = signal(true);
  saving = signal(false);

  constructor() {
    this.categoriesApi.categories().subscribe((items) => this.categories.set(items));
    this.api.me().subscribe({
      next: (item) => {
        this.description = String(item["description"] ?? "");
        this.address = String(item["address"] ?? "");
        this.neighborhood = String(item["neighborhood"] ?? "");
        this.city = String(item["city"] ?? "");
        this.state = String(item["state"] ?? "");
        this.latitude = Number(item["latitude"] ?? 0);
        this.longitude = Number(item["longitude"] ?? 0);
        this.serviceRadiusMeters = Number(item["serviceRadiusMeters"] ?? 5000);
        this.isAvailable = Boolean(item["isAvailable"]);
        if (this.latitude && this.longitude) {
          this.markers = [{ lat: this.latitude, lng: this.longitude, label: "Base de atendimento" }];
        }
        const services = (item["services"] as Array<{ categoryId: string; isActive: boolean }>) ?? [];
        services.filter((service) => service.isActive).forEach((service) => this.selected.add(service.categoryId));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  pick(lat: number, lng: number): void {
    this.latitude = lat;
    this.longitude = lng;
    this.markers = [{ lat, lng, label: "Base de atendimento" }];
  }

  toggle(id: string): void {
    const next = new Set(this.selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selected = next;
  }

  save(): void {
    this.saving.set(true);
    this.api
      .update({
        description: this.description,
        address: this.address,
        neighborhood: this.neighborhood,
        city: this.city,
        state: this.state,
        latitude: this.latitude,
        longitude: this.longitude,
        serviceRadiusMeters: this.serviceRadiusMeters,
      })
      .subscribe({
        next: () => {
          this.api
            .availability({
              isAvailable: this.isAvailable,
              windows: [{ weekday: new Date().getDay(), startMinutes: 0, endMinutes: 1440 }],
            })
            .subscribe();
          this.api
            .services(
              [...this.selected].map((categoryId) => ({
                categoryId,
                minimumVisitFeeCents: 8000,
                isActive: true,
              })),
            )
            .subscribe({
              next: () => {
                this.saving.set(false);
                this.saved.set(true);
              },
              error: () => this.saving.set(false),
            });
        },
        error: () => this.saving.set(false),
      });
  }
}
