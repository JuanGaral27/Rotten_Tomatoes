/**
 * Formato único de respuesta exitosa:
 *   { success: true, data: ..., meta?: ... }
 * (los errores salen con { success: false, error: {...} } desde errorHandler)
 */
const body = (data, meta) => ({ success: true, data, ...(meta ? { meta } : {}) });

export const sendOk = (res, data, meta) => res.status(200).json(body(data, meta));

export const sendCreated = (res, data, meta) => res.status(201).json(body(data, meta));

export const sendNoContent = (res) => res.status(204).end();
