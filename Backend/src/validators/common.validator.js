import { z } from 'zod';
import { PAGINATION } from '../config/constants.js';

export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'ID inválido');

export const imdbIdSchema = z
  .string()
  .trim()
  .regex(/^tt\d{7,9}$/i, 'imdbId inválido (ejemplo: tt1375666)')
  .transform((value) => value.toLowerCase());

export const sortOrderSchema = z.enum(['asc', 'desc']);

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

// Acepta "a,b,c" y también ?x=a&x=b -> ["a", "b", "c"]
export const csvListSchema = z
  .union([z.string(), z.array(z.string())])
  .transform((value) =>
    (Array.isArray(value) ? value : [value])
      .flatMap((item) => item.split(','))
      .map((item) => item.trim())
      .filter(Boolean),
  );

export const idParams = z.object({ id: objectIdSchema });
