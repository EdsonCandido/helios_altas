export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

type StatusEntry = {
  label: string;
  tone: StatusTone;
};

const STATUS_MAP: Record<string, StatusEntry> = {
  SEARCHING: { label: "Buscando", tone: "warning" },
  PENDING: { label: "Pendente", tone: "warning" },
  ACCEPTED: { label: "Aceita", tone: "info" },
  IN_PROGRESS: { label: "Em andamento", tone: "info" },
  COMPLETED: { label: "Concluída", tone: "success" },
  CANCELLED: { label: "Cancelada", tone: "danger" },
  EXPIRED: { label: "Expirada", tone: "danger" },
  INVITED: { label: "Convidado", tone: "info" },
  REJECTED: { label: "Recusada", tone: "danger" },
  DECLINED: { label: "Recusada", tone: "danger" },
  ACTIVE: { label: "Ativo", tone: "success" },
  INACTIVE: { label: "Inativo", tone: "neutral" },
  BLOCKED: { label: "Bloqueado", tone: "danger" },
};

const ROLE_MAP: Record<string, string> = {
  CLIENT: "Cliente",
  PARTNER: "Parceiro",
  ADMIN: "Administrador",
};

function asKey(value: unknown): string {
  return String(value ?? "").trim().toUpperCase();
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function statusLabel(value: unknown): string {
  const key = asKey(value);
  if (!key) {
    return "";
  }
  return STATUS_MAP[key]?.label ?? humanize(key);
}

export function statusClass(value: unknown): string {
  const key = asKey(value);
  const tone = STATUS_MAP[key]?.tone ?? "neutral";
  return `status status-${tone}`;
}

export function roleLabel(value: unknown): string {
  const key = asKey(value);
  if (!key) {
    return "";
  }
  return ROLE_MAP[key] ?? humanize(key);
}
