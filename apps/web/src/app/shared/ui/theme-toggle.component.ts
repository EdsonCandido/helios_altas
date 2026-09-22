import { Component, inject } from "@angular/core";
import { ThemeStore } from "../../core/theme/theme.store";

@Component({
  selector: "app-theme-toggle",
  template: `
    <button
      type="button"
      class="btn btn-ghost btn-icon theme-toggle"
      (click)="theme.toggle()"
      [attr.aria-label]="theme.theme() === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'"
      [attr.title]="theme.theme() === 'dark' ? 'Tema claro' : 'Tema escuro'"
    >
      @if (theme.theme() === "dark") {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path
            stroke-linecap="round"
            d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"
          />
        </svg>
      } @else {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.5 13.2A6.2 6.2 0 0 1 10.8 7.4 5.8 5.8 0 1 0 16.5 13.2Z"
          />
        </svg>
      }
    </button>
  `,
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeStore);
}
