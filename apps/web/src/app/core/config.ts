export type AppConfig = {
  apiUrl: string;
  socketUrl: string;
};

let cached: AppConfig | null = null;

export async function loadAppConfig(): Promise<AppConfig> {
  if (cached) {
    return cached;
  }

  const response = await fetch("/config.json");
  cached = (await response.json()) as AppConfig;
  return cached;
}

export function getAppConfig(): AppConfig {
  if (!cached) {
    throw new Error("App config was not loaded.");
  }
  return cached;
}
