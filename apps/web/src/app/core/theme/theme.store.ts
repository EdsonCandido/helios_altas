import { Injectable, signal } from "@angular/core";

export type ThemeName = "light" | "dark";

const STORAGE_KEY = "helios.theme";

@Injectable({ providedIn: "root" })
export class ThemeStore {
  readonly theme = signal<ThemeName>("light");

  constructor() {
    this.apply(this.read());
  }

  toggle(): void {
    this.setTheme(this.theme() === "dark" ? "light" : "dark");
  }

  setTheme(theme: ThemeName): void {
    this.apply(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  private read(): ThemeName {
    const fromDom = document.documentElement.dataset["theme"];
    if (fromDom === "light" || fromDom === "dark") {
      return fromDom;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  private apply(theme: ThemeName): void {
    this.theme.set(theme);
    document.documentElement.dataset["theme"] = theme;
  }
}
