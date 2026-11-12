/**
 * Error "esperado" de la API. Lleva el status HTTP y un código estable
 * (para que el frontend pueda reaccionar sin parsear mensajes).
 */
export class ApiError extends Error {
  constructor(statusCode, message, { code = 'ERROR', details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, options) {
    return new ApiError(400, message, { code: 'BAD_REQUEST', ...options });
  }

  static unauthorized(message = 'No autenticado', options) {
    return new ApiError(401, message, { code: 'UNAUTHORIZED', ...options });
  }

  static forbidden(message = 'No tienes permisos para realizar esta acción', options) {
    return new ApiError(403, message, { code: 'FORBIDDEN', ...options });
  }

  static notFound(message = 'Recurso no encontrado', options) {
    return new ApiError(404, message, { code: 'NOT_FOUND', ...options });
  }

  static conflict(message, options) {
    return new ApiError(409, message, { code: 'CONFLICT', ...options });
  }

  static tooManyRequests(message, options) {
    return new ApiError(429, message, { code: 'TOO_MANY_REQUESTS', ...options });
  }

  static badGateway(message, options) {
    return new ApiError(502, message, { code: 'BAD_GATEWAY', ...options });
  }

  static serviceUnavailable(message, options) {
    return new ApiError(503, message, { code: 'SERVICE_UNAVAILABLE', ...options });
  }
}
