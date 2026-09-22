import { HttpErrorResponse } from "@angular/common/http";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: Array<{ field?: string; message?: string }>;
  };
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const body = error.error as ApiErrorBody | null;
  const message = body?.error?.message?.trim();
  if (message) {
    return message;
  }

  if (error.status === 0) {
    return "Não foi possível conectar ao servidor.";
  }

  if (error.status === 401) {
    return "Sessão expirada. Entre novamente.";
  }

  if (error.status === 403) {
    return "Você não tem permissão para esta ação.";
  }

  if (error.status === 404) {
    return "Recurso não encontrado.";
  }

  if (error.status === 429) {
    return "Muitas tentativas. Aguarde um momento e tente de novo.";
  }

  return fallback;
}
