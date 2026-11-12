import { z } from 'zod';
import {
  DEFAULT_RATING_SOURCE,
  MEDIA_TYPE_VALUES,
  MOVIE_SORT_KEYS,
  RATING_SOURCE_KEYS,
  SCORE,
} from '../config/constants.js';
import { csvListSchema, imdbIdSchema, paginationQuery, sortOrderSchema } from './common.validator.js';

const yearSchema = z.coerce.number().int().min(1800).max(2100);
const mediaTypeSchema = z.enum(MEDIA_TYPE_VALUES);
const scoreFilterSchema = z.coerce.number().min(SCORE.MIN).max(SCORE.MAX);

// GET /movies  (filtros + ordenamiento sobre NUESTRA base de datos)
export const listMoviesQuery = paginationQuery
  .extend({
    q: z.string().trim().min(1).optional(), // nombre (búsqueda parcial)
    type: mediaTypeSchema.optional(),
    genre: csvListSchema.optional(), // categorías: Action,Drama
    actor: z.string().trim().min(1).optional(),
    year: yearSchema.optional(),
    releasedFrom: z.coerce.date().optional(), // fecha de estreno desde (YYYY-MM-DD)
    releasedTo: z.coerce.date().optional(), // fecha de estreno hasta
    minRating: scoreFilterSchema.optional(),
    maxRating: scoreFilterSchema.optional(),
    ratingSource: z.enum(RATING_SOURCE_KEYS).default(DEFAULT_RATING_SOURCE),
    sortBy: z.enum(MOVIE_SORT_KEYS).default('date'),
    order: sortOrderSchema.optional(),
  })
  .refine((q) => q.minRating === undefined || q.maxRating === undefined || q.minRating <= q.maxRating, {
    message: 'minRating no puede ser mayor que maxRating',
    path: ['minRating'],
  })
  .refine((q) => !q.releasedFrom || !q.releasedTo || q.releasedFrom <= q.releasedTo, {
    message: 'releasedFrom no puede ser posterior a releasedTo',
    path: ['releasedFrom'],
  });

// GET /movies/external/search  (busca en OMDb, no guarda nada)
export const externalSearchQuery = z.object({
  q: z.string().trim().min(1, 'q es obligatorio'),
  type: mediaTypeSchema.optional(),
  year: yearSchema.optional(),
  page: z.coerce.number().int().min(1).max(100).default(1),
});

// POST /movies/import  (por imdbId o por título)
export const importMovieBody = z
  .object({
    imdbId: imdbIdSchema.optional(),
    title: z.string().trim().min(1).optional(),
    year: yearSchema.optional(),
    type: mediaTypeSchema.optional(),
  })
  .refine((body) => body.imdbId || body.title, { message: 'Envía "imdbId" o "title"' });

// POST /movies/sync  (importa en bloque los resultados de una búsqueda)
export const syncMoviesBody = z.object({
  q: z.string().trim().min(1, 'q es obligatorio'),
  type: mediaTypeSchema.optional(),
  year: yearSchema.optional(),
  page: z.coerce.number().int().min(1).max(100).default(1),
});

export const imdbIdParams = z.object({ imdbId: imdbIdSchema });
