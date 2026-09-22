import { Component, ElementRef, inject, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { getApiErrorMessage } from "../../core/api/api-error";
import { GeoApiService, type GeoAddress } from "../../shared/geo/geo-api.service";
import { MapComponent } from "../../shared/map/map.component";
import { ClientApiService } from "./client-api.service";

@Component({
  selector: "app-new-request-page",
  imports: [FormsModule, MapComponent],
  template: `
    <section class="stack">
      <header class="page-head">
        <div>
          <p class="kicker">Pedido</p>
          <h1>Nova solicitação</h1>
          <p class="lede">Descreva o serviço e pinte o ponto no mapa. O resto o campo resolve.</p>
        </div>
      </header>
      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }
      <form class="split" (ngSubmit)="submit()">
        <div class="panel stack">
          <label class="field">
            Categoria
            <select name="categoryId" [(ngModel)]="categoryId" required>
              @for (category of categories(); track category.id) {
                <option [value]="category.id">{{ category.name }}</option>
              }
            </select>
          </label>
          <label class="field">
            Descrição do problema
            <textarea
              name="description"
              [(ngModel)]="description"
              required
              minlength="10"
              placeholder="Descreva o problema com pelo menos 10 caracteres"
            ></textarea>
          </label>
          <label class="check">
            <input type="checkbox" name="isHomeService" [(ngModel)]="isHomeService" />
            Atendimento na residência
          </label>
          <div class="form-grid">
            <label class="field span-2">Endereço <input name="address" [(ngModel)]="address" required /></label>
            <label class="field">
              Número *
              <input
                #addressNumberInput
                name="addressNumber"
                [(ngModel)]="addressNumber"
                required
                maxlength="20"
                autocomplete="address-line2"
              />
            </label>
            <label class="field">Bairro <input name="neighborhood" [(ngModel)]="neighborhood" /></label>
            <label class="field">Cidade <input name="city" [(ngModel)]="city" required /></label>
            <label class="field">UF <input name="state" [(ngModel)]="state" required maxlength="2" /></label>
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="submitting() || lookingUp()">
            {{ submitting() ? "Enviando…" : "Enviar solicitação" }}
          </button>
        </div>
        <div class="panel stack">
          <p class="panel-title">Local do atendimento</p>
          <button
            class="btn btn-ghost"
            type="button"
            (click)="useLocation()"
            [disabled]="lookingUp()"
          >
            {{ lookingUp() ? "Buscando endereço…" : "Usar localização atual" }}
          </button>
          <app-map
            [center]="[latitude || -23.55, longitude || -46.63]"
            [markers]="markers"
            [clickable]="true"
            [draggable]="true"
            (pick)="pick($event.lat, $event.lng)"
          />
        </div>
      </form>
    </section>
  `,
})
export class NewRequestPage {
  private readonly api = inject(ClientApiService);
  private readonly geoApi = inject(GeoApiService);
  private readonly router = inject(Router);
  private readonly addressNumberInput = viewChild<ElementRef<HTMLInputElement>>("addressNumberInput");

  categories = signal<Array<{ id: string; name: string }>>([]);
  categoryId = "";
  description = "";
  isHomeService = true;
  address = "";
  addressNumber = "";
  neighborhood = "";
  city = "";
  state = "";
  latitude = 0;
  longitude = 0;
  error = signal("");
  submitting = signal(false);
  lookingUp = signal(false);
  markers: Array<{ lat: number; lng: number; label: string }> = [];

  constructor() {
    this.api.categories().subscribe((items) => {
      this.categories.set(items);
      this.categoryId = items[0]?.id ?? "";
    });
  }

  useLocation(): void {
    this.error.set("");
    if (!navigator.geolocation) {
      this.error.set("Geolocalização não disponível neste navegador.");
      return;
    }

    this.lookingUp.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.pick(position.coords.latitude, position.coords.longitude);
      },
      () => {
        this.lookingUp.set(false);
        this.error.set("Não foi possível obter a localização atual.");
      },
    );
  }

  pick(lat: number, lng: number): void {
    this.latitude = lat;
    this.longitude = lng;
    this.markers = [{ lat, lng, label: "Local do atendimento" }];
    this.error.set("");
    this.lookingUp.set(true);

    this.geoApi.reverse(lat, lng).subscribe({
      next: (result) => {
        this.applyAddress(result);
        this.lookingUp.set(false);
        queueMicrotask(() => this.focusAddressNumber());
      },
      error: (err: unknown) => {
        this.lookingUp.set(false);
        this.error.set(getApiErrorMessage(err, "Não foi possível obter o endereço a partir da localização."));
      },
    });
  }

  submit(): void {
    this.error.set("");
    if (!this.categoryId) {
      this.error.set("Categoria: Selecione uma categoria.");
      return;
    }
    if (this.description.trim().length < 10) {
      this.error.set("Descrição do problema: Deve ter pelo menos 10 caracteres.");
      return;
    }
    if (!this.address.trim()) {
      this.error.set("Endereço: Informe o endereço.");
      return;
    }
    if (!this.addressNumber.trim()) {
      this.error.set("Número: Informe o número da residência.");
      this.focusAddressNumber();
      return;
    }
    if (!this.city.trim()) {
      this.error.set("Cidade: Informe a cidade.");
      return;
    }
    if (this.state.trim().length !== 2) {
      this.error.set("UF: Informe a UF com 2 letras.");
      return;
    }
    if (!this.latitude || !this.longitude) {
      this.error.set("Informe o local do atendimento no mapa.");
      return;
    }

    this.submitting.set(true);
    this.api
      .createRequest({
        categoryId: this.categoryId,
        description: this.description.trim(),
        address: this.address.trim(),
        addressNumber: this.addressNumber.trim(),
        neighborhood: this.neighborhood.trim() || undefined,
        city: this.city.trim(),
        state: this.state.trim().toUpperCase(),
        latitude: this.latitude,
        longitude: this.longitude,
        isHomeService: this.isHomeService,
      })
      .subscribe({
        next: (result) => {
          const id = (result as { id: string }).id;
          void this.router.navigate(["/cliente/solicitacoes", id]);
        },
        error: (err: unknown) => {
          this.submitting.set(false);
          this.error.set(getApiErrorMessage(err, "Não foi possível criar a solicitação."));
        },
      });
  }

  private applyAddress(result: GeoAddress): void {
    if (result.address) {
      this.address = result.address;
    }
    if (result.addressNumber) {
      this.addressNumber = result.addressNumber;
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
  }

  private focusAddressNumber(): void {
    this.addressNumberInput()?.nativeElement.focus();
  }
}
