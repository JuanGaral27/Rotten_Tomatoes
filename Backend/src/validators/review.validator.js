import { z } from 'zod';
import { REVIEWER_TYPE_VALUES, REVIEW_COMMENT, SCORE } from '../config/constants.js';
import { objectIdSchema, paginationQuery, sortOrderSchema } from './common.validator.js';

const ratingSchema = z
  .number({ error: 'El puntaje debe ser un número' })
  .min(SCORE.MIN)
  .max(SCORE.MAX)
  .multipleOf(SCORE.STEP, `El puntaje debe ir de ${SCORE.STEP} en ${SCORE.STEP} (ej: 7, 7.5)`);

const commentSchema = z.string().trim().min(REVIEW_COMMENT.MIN_LENGTH).max(REVIEW_COMMENT.MAX_LENGTH);

export const movieIdParams = z.object({ movieId: objectIdSchema });

export const createReviewBody = z.object({
  rating: ratingSchema,
  comment: commentSchema,
});

export const updateReviewBody = z
  .object({
    rating: ratingSchema.optional(),
    comment: commentSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'Envía al menos un campo para actualizar' });

export const REVIEW_SORT_KEYS = ['date', 'rating'];

export const listReviewsQuery = paginationQuery.extend({
  reviewerType: z.enum(REVIEWER_TYPE_VALUES).optional(),
  sortBy: z.enum(REVIEW_SORT_KEYS).default('date'),
  order: sortOrderSchema.default('desc'),
});
