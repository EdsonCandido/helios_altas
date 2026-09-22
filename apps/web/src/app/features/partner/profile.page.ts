import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { getApiErrorMessage } from "../../core/api/api-error";
import { formatCep, isValidCep } from "../../shared/br/cep.util";
import { GeoApiService, type GeoAddress } from "../../shared/geo/geo-api.service";
import { MapComponent } from "../../shared/map/map.component";
import { ClientApiService } from "../client/client-api.service";
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
              <label class="field">
                CEP *
                <input
                  name="cep"
                  [(ngModel)]="cep"
                  (ngModelChange)="handleCepChange($event)"
                  maxlength="9"
                  inputmode="numeric"
                  autocomplete="postal-code"
                  required
                />
              </label>
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
              <button class="btn btn-primary" type="submit" [disabled]="saving() || lookingUp()">
                {{ saving() ? "Salvando…" : "Salvar" }}
              </button>
            </div>
            @if (error()) {
              <p class="status status-danger">{{ error() }}</p>
            }
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
              [draggable]="true"
              (pick)="pick($event.lat, $event.lng)"
            />
            @if (lookingUp()) {
              <p class="status">Atualizando endereço…</p>
            }
          </div>
        </form>
      }
    </section>
  `,
})
export class PartnerProfilePage {
  private readonly api = inject(PartnerApiService);
  private readonly categoriesApi = inject(ClientApiService);
  private readonly geoApi = inject(GeoApiService);
  private cepLookupTimer?: ReturnType<typeof setTimeout>;
  private syncSource: "cep" | "map" | null = null;

  description = "";
  cep = "";
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
  lookingUp = signal(false);
  error = signal("");

  constructor() {
    this.categoriesApi.categories().subscribe((items) => this.categories.set(items));
    this.api.me().subscribe({
      next: (item) => {
        this.description = String(item["description"] ?? "");
        this.cep = formatCep(String(item["cep"] ?? ""));
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

  handleCepChange(value: string): void {
    this.cep = formatCep(value);
    this.error.set("");
    this.saved.set(false);

    if (this.syncSource !== null) {
      return;
    }

    if (this.cepLookupTimer) {
      clearTimeout(this.cepLookupTimer);
    }

    if (!isValidCep(this.cep)) {
      return;
    }

    this.cepLookupTimer = setTimeout(() => this.lookupFromCep(), 400);
  }

  pick(lat: number, lng: number): void {
    this.latitude = lat;
    this.longitude = lng;
    this.markers = [{ lat, lng, label: "Base de atendimento" }];
    this.error.set("");
    this.saved.set(false);
    this.lookingUp.set(true);
    this.syncSource = "map";

    this.geoApi.reverse(lat, lng).subscribe({
      next: (result) => {
        this.applyAddress(result, "map");
        this.lookingUp.set(false);
        this.syncSource = null;
      },
      error: (err: unknown) => {
        this.lookingUp.set(false);
        this.syncSource = null;
        this.error.set(getApiErrorMessage(err, "Não foi possível obter o endereço a partir do mapa."));
      },
    });
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
    this.error.set("");
    this.saved.set(false);

    if (!isValidCep(this.cep)) {
      this.error.set("Informe um CEP válido no formato 00000-000.");
      return;
    }

    this.saving.set(true);
    this.api
      .update({
        description: this.description,
        cep: this.cep,
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
              windows: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
                weekday,
                startMinutes: 0,
                endMinutes: 1440,
              })),
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
              error: (err: unknown) => {
                this.saving.set(false);
                this.error.set(getApiErrorMessage(err, "Não foi possível salvar os serviços."));
              },
            });
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.error.set(getApiErrorMessage(err, "Não foi possível salvar o perfil."));
        },
      });
  }

  private lookupFromCep(): void {
    this.lookingUp.set(true);
    this.syncSource = "cep";
    this.geoApi.lookupCep(this.cep).subscribe({
      next: (result) => {
        this.applyAddress(result, "cep");
        this.lookingUp.set(false);
        this.syncSource = null;
      },
      error: (err: unknown) => {
        this.lookingUp.set(false);
        this.syncSource = null;
        this.error.set(getApiErrorMessage(err, "CEP não encontrado."));
      },
    });
  }

  private applyAddress(result: GeoAddress, source: "cep" | "map"): void {
    if (result.cep) {
      this.cep = formatCep(result.cep);
    }
    if (result.address) {
      this.address = result.address;
    }
    if (result.neighborhood) {
      this.neighborhood = result.neighborhood;
    }
    if (result.city) {
      this.city = result.city;
    }
    if (result.state) {
      this.state = result.state;
    }

    if (result.latitude !== null && result.longitude !== null) {
      this.latitude = result.latitude;
      this.longitude = result.longitude;
      this.markers = [
        { lat: result.latitude, lng: result.longitude, label: "Base de atendimento" },
      ];
    } else if (source === "cep") {
      this.error.set("Endereço encontrado, mas sem coordenadas. Clique no mapa para marcar a base.");
    }
  }
}
