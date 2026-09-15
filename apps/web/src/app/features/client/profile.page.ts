import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ClientApiService } from "./client-api.service";

@Component({
  selector: "app-client-profile-page",
  imports: [FormsModule],
  template: `
    <section class="stack">
      <header class="page-head">
        <div>
          <p class="kicker">Conta</p>
          <h1>Meu perfil</h1>
        </div>
      </header>
      @if (loading()) {
        <div class="skeleton" aria-busy="true">
          <span class="skeleton-block"></span>
        </div>
      } @else {
        <form class="panel stack" (ngSubmit)="save()">
          <div class="form-grid">
            <label class="field span-2">
              Endereço
              <input name="homeAddress" [(ngModel)]="homeAddress" />
            </label>
            <label class="field">
              Bairro
              <input name="homeNeighborhood" [(ngModel)]="homeNeighborhood" />
            </label>
            <label class="field">Cidade <input name="homeCity" [(ngModel)]="homeCity" /></label>
            <label class="field">UF <input name="homeState" [(ngModel)]="homeState" maxlength="2" /></label>
          </div>
          <div class="actions">
            <button class="btn btn-primary" type="submit" [disabled]="saving()">
              {{ saving() ? "Salvando…" : "Salvar" }}
            </button>
          </div>
          @if (saved()) {
            <p class="status status-success">Perfil atualizado</p>
          }
        </form>
      }
    </section>
  `,
})
export class ClientProfilePage {
  private readonly api = inject(ClientApiService);
  homeAddress = "";
  homeNeighborhood = "";
  homeCity = "";
  homeState = "";
  saved = signal(false);
  loading = signal(true);
  saving = signal(false);

  constructor() {
    this.api.profile().subscribe({
      next: (item) => {
        this.homeAddress = String(item?.["homeAddress"] ?? "");
        this.homeNeighborhood = String(item?.["homeNeighborhood"] ?? "");
        this.homeCity = String(item?.["homeCity"] ?? "");
        this.homeState = String(item?.["homeState"] ?? "");
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    this.saving.set(true);
    this.api
      .updateProfile({
        homeAddress: this.homeAddress,
        homeNeighborhood: this.homeNeighborhood,
        homeCity: this.homeCity,
        homeState: this.homeState,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.set(true);
        },
        error: () => this.saving.set(false),
      });
  }
}
