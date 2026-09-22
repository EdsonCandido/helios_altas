import { Component, effect, input, output } from "@angular/core";

@Component({
  selector: "app-modal",
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="handleBackdrop($event)">
        <div
          class="modal-dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="headingId"
          (click)="$event.stopPropagation()"
        >
          <header class="modal-head">
            <div>
              @if (kicker()) {
                <p class="kicker">{{ kicker() }}</p>
              }
              <h2 [id]="headingId">{{ title() }}</h2>
            </div>
            <button class="btn btn-ghost btn-icon" type="button" (click)="closed.emit()" aria-label="Fechar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path stroke-linecap="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>
          <div class="modal-body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly kicker = input("");
  readonly closed = output<void>();
  readonly headingId = `modal-title-${Math.random().toString(36).slice(2, 8)}`;

  constructor() {
    effect((onCleanup) => {
      if (!this.open()) {
        return;
      }

      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          this.closed.emit();
        }
      };
      document.addEventListener("keydown", handleKey);
      onCleanup(() => {
        document.body.style.overflow = previous;
        document.removeEventListener("keydown", handleKey);
      });
    });
  }

  handleBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
}
