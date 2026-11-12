import { ApiError } from '../utils/ApiError.js';

/**
 * Valida params / query / body con esquemas de Zod.
 * Los datos ya limpios y convertidos quedan en `req.valid.{params,query,body}`
 * (los controladores leen de ahí, nunca de req.body directamente).
 *
 *   validate({ params: idParams, body: updateUserBody })
 */
export const validate = (schemas) => (req, _res, next) => {
  const valid = {};
  const issues = [];

  for (const location of ['params', 'query', 'body']) {
    const schema = schemas[location];
    if (!schema) continue;

    const result = schema.safeParse(req[location] ?? {});
    if (result.success) {
      valid[location] = result.data;
    } else {
      issues.push(
        ...result.error.issues.map((issue) => ({
          location,
          field: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
  }

  if (issues.length > 0) {
    return next(
      ApiError.badRequest('Datos de entrada inválidos', { code: 'VALIDATION_ERROR', details: issues }),
    );
  }

  req.valid = valid;
  next();
};
