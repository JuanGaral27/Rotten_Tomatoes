import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from '../models/api.models';

const NETWORK_MESSAGE = 'No se pudo conectar con el servidor. Revisa que el backend esté encendido.';

/** Obtiene un mensaje legible para el usuario a partir de cualquier error HTTP. */
export const getErrorMessage = (error: unknown): string => {
  if (!(error instanceof HttpErrorResponse)) return 'Ocurrió un error inesperado';
  if (error.status === 0) return NETWORK_MESSAGE;

  const body = error.error as Partial<ApiErrorBody> | null;
  const apiError = body?.error;
  if (!apiError) return 'Ocurrió un error inesperado';

  // Errores de validación: "campo: mensaje"
  const details = apiError.details;
  if (apiError.code === 'VALIDATION_ERROR' && Array.isArray(details) && details.length > 0) {
    return details
      .map((detail) => (typeof detail === 'string' ? detail : detail.field ? `${detail.field}: ${detail.message}` : detail.message))
      .join('\n');
  }
  return apiError.message;
};

export const getErrorCode = (error: unknown): string | null =>
  error instanceof HttpErrorResponse ? ((error.error as Partial<ApiErrorBody> | null)?.error?.code ?? null) : null;
