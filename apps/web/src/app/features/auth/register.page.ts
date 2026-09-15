import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthStore } from "../../core/auth/auth.store";

@Component({
  selector: "app-register-page",
  imports: [FormsModule, RouterLink],
  template: `
    <section class="auth-stage">
      <div class="auth-brand">
        <p class="kicker">Helios Altas</p>
        <h1>Abra seu lugar no mapa</h1>
        <p class="lede">Cliente pede. Parceiro atende. O encontro acontece por perto.</p>
      </div>
      <div class="auth-panel">
        <form class="card stack" (ngSubmit)="submit()">
          <header class="page-head">
            <div>
              <p class="kicker">Cadastro</p>
              <h2>Criar conta</h2>
            </div>
          </header>
          @if (error()) {
            <div class="alert alert-error" role="alert">{{ error() }}</div>
          }
          <div class="form-grid">
            <label class="field">Nome <input name="name" [(ngModel)]="name" required autocomplete="name" /></label>
            <label class="field">
              E-mail
              <input name="email" type="email" [(ngModel)]="email" required autocomplete="email" />
            </label>
            <label class="field">
              Telefone
              <input name="phone" [(ngModel)]="phone" required autocomplete="tel" />
            </label>
            <label class="field">
              Senha
              <input
                name="password"
                type="password"
                [(ngModel)]="password"
                required
                autocomplete="new-password"
              />
            </label>
            <fieldset class="field span-2">
              <legend>Perfil</legend>
              <div class="choice-row">
                <label><input type="radio" name="role" value="CLIENT" [(ngModel)]="role" /> Cliente</label>
                <label><input type="radio" name="role" value="PARTNER" [(ngModel)]="role" /> Parceiro</label>
              </div>
            </fieldset>
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="submitting()">
            {{ submitting() ? "Cadastrando…" : "Cadastrar" }}
          </button>
          <a routerLink="/login">Já tenho conta</a>
        </form>
      </div>
    </section>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthStore);
  name = "";
  email = "";
  phone = "";
  password = "";
  role: "CLIENT" | "PARTNER" = "CLIENT";
  error = signal("");
  submitting = signal(false);

  async submit(): Promise<void> {
    this.error.set("");
    this.submitting.set(true);
    try {
      await this.auth.register({
        name: this.name,
        email: this.email,
        phone: this.phone,
        password: this.password,
        role: this.role,
      });
    } catch {
      this.error.set("Não foi possível criar a conta.");
    } finally {
      this.submitting.set(false);
    }
  }
}
