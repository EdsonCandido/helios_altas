import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
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
            <textarea name="description" [(ngModel)]="description" required minlength="10"></textarea>
          </label>
          <label class="check">
            <input type="checkbox" name="isHomeService" [(ngModel)]="isHomeService" />
            Atendimento na residência
          </label>
          <div class="form-grid">
            <label class="field span-2">Endereço <input name="address" [(ngModel)]="address" required /></label>
            <label class="field">Bairro <input name="neighborhood" [(ngModel)]="neighborhood" /></label>
            <label class="field">Cidade <input name="city" [(ngModel)]="city" required /></label>
            <label class="field">UF <input name="state" [(ngModel)]="state" required maxlength="2" /></label>
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="submitting()">
            {{ submitting() ? "Enviando…" : "Enviar solicitação" }}
          </button>
        </div>
        <div class="panel stack">
          <p class="panel-title">Local do atendimento</p>
          <button class="btn btn-ghost" type="button" (click)="useLocation()">Usar localização atual</button>
          <app-map
            [center]="[latitude || -23.55, longitude || -46.63]"
            [markers]="markers"
            [clickable]="true"
            (pick)="pick($event.lat, $event.lng)"
          />
        </div>
      </form>
    </section>
  `,
})
export class NewRequestPage {
  private readonly api = inject(ClientApiService);
  private readonly router = inject(Router);
  categories = signal<Array<{ id: string; name: string }>>([]);
  categoryId = "";
  description = "";
  isHomeService = true;
  address = "";
  neighborhood = "";
  city = "";
  state = "";
  latitude = 0;
  longitude = 0;
  error = signal("");
  submitting = signal(false);
  markers: Array<{ lat: number; lng: number; label: string }> = [];

  constructor() {
    this.api.categories().subscribe((items) => {
      this.categories.set(items);
      this.categoryId = items[0]?.id ?? "";
    });
  }

  useLocation(): void {
    navigator.geolocation.getCurrentPosition((position) => {
      this.pick(position.coords.latitude, position.coords.longitude);
    });
  }

  pick(lat: number, lng: number): void {
    this.latitude = lat;
    this.longitude = lng;
    this.markers = [{ lat, lng, label: "Local do atendimento" }];
  }

  submit(): void {
    this.error.set("");
    if (!this.latitude || !this.longitude) {
      this.error.set("Informe o local do atendimento no mapa.");
      return;
    }

    this.submitting.set(true);
    this.api
      .createRequest({
        categoryId: this.categoryId,
        description: this.description,
        address: this.address,
        neighborhood: this.neighborhood,
        city: this.city,
        state: this.state,
        latitude: this.latitude,
        longitude: this.longitude,
        isHomeService: this.isHomeService,
      })
      .subscribe({
        next: (result) => {
          const id = (result as { id: string }).id;
          void this.router.navigate(["/cliente/solicitacoes", id]);
        },
        error: () => {
          this.submitting.set(false);
          this.error.set("Não foi possível criar a solicitação.");
        },
      });
  }
}
