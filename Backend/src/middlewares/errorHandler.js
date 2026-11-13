import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Mensajes claros para los campos únicos más comunes.
const DUPLICATE_MESSAGES = {
  email: 'Ese correo ya está registrado. Inicia sesión.',
  username: 'Ese nombre de usuario ya está en uso. Elige otro.',
};

/**
 * Campos que causaron el error de duplicado. MongoDB los manda en keyPattern/keyValue;
 * si no vienen, se deducen del nombre del índice en el mensaje ("index: email_1 ...").
 */
const duplicatedFields = (error) => {
  const fromDriver = Object.keys(error.keyPattern ?? error.keyValue ?? {});
  if (fromDriver.length > 0) return fromDriver;

  const match = /index:\s*([A-Za-z0-9_.]+?)_-?1\b/.exec(error.message ?? '');
  return match ? [match[1]] : [];
};

/** Convierte cualquier error (propio, de Mongoose, de Express) en un ApiError. */
const toApiError = (error) => {
  if (error instanceof ApiError) return error;

  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }));
    return ApiError.badRequest('Error de validación', { code: 'VALIDATION_ERROR', details });
  }

  if (error instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Valor inválido para "${error.path}"`, { code: 'INVALID_VALUE' });
  }

  if (error?.code === 11000) {
    const fields = duplicatedFields(error);
    const message =
      fields.map((field) => DUPLICATE_MESSAGES[field]).find(Boolean) ?? 'Ya existe un registro con esos datos';
    return ApiError.conflict(message, { code: 'DUPLICATE_KEY', details: fields });
  }

  if (error?.type === 'entity.parse.failed') {
    return ApiError.badRequest('El cuerpo de la petición no es un JSON válido', { code: 'INVALID_JSON' });
  }

  if (error?.type === 'entity.too.large') {
    return new ApiError(413, 'El cuerpo de la petición es demasiado grande', { code: 'PAYLOAD_TOO_LARGE' });
  }

  return new ApiError(500, 'Error interno del servidor', { code: 'INTERNAL_ERROR' });
};

// El cuarto parámetro (_next) es obligatorio para que Express lo reconozca como manejador de errores.
export const errorHandler = (error, _req, res, _next) => {
  const apiError = toApiError(error);
  const isServerError = apiError.statusCode >= 500;

  if (isServerError) console.error(error);

  res.status(apiError.statusCode).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details && { details: apiError.details }),
      ...(isServerError && !config.isProduction && { stack: error.stack }),
    },
  });
};
