import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuthStore } from "../../core/auth/auth.store";

@Component({
  selector: "app-login-page",
  imports: [FormsModule, RouterLink],
  template: `
    <section class="auth-stage">
      <div class="auth-brand">
        <p class="kicker">Helios Altas</p>
        <h1>O atlas do atendimento perto de você</h1>
        <p class="lede">Encontre quem resolve. Peça, acompanhe e feche o serviço no mapa da sua rua.</p>
      </div>
      <div class="auth-panel">
        <form class="card stack" (ngSubmit)="submit()">
          <header class="page-head">
            <div>
              <p class="kicker">Acesso</p>
              <h2>Entrar</h2>
            </div>
          </header>
          @if (error()) {
            <div class="alert alert-error" role="alert">{{ error() }}</div>
          }
          <label class="field">
            E-mail
            <input name="email" type="email" [(ngModel)]="email" required autocomplete="email" />
          </label>
          <label class="field">
            Senha
            <input
              name="password"
              type="password"
              [(ngModel)]="password"
              required
              autocomplete="current-password"
            />
          </label>
          <button class="btn btn-primary" type="submit" [disabled]="submitting()">
            {{ submitting() ? "Entrando…" : "Entrar" }}
          </button>
          <a routerLink="/cadastro">Criar conta</a>
        </form>
      </div>
    </section>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthStore);
  email = "";
  password = "";
  error = signal("");
  submitting = signal(false);

  async submit(): Promise<void> {
    this.error.set("");
    this.submitting.set(true);
    try {
      await this.auth.login(this.email, this.password);
    } catch {
      this.error.set("Não foi possível entrar. Verifique e-mail e senha.");
    } finally {
      this.submitting.set(false);
    }
  }
}
