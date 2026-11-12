import { Router } from 'express';
import { ROLES } from '../config/constants.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import {
  externalSearchQuery,
  imdbIdParams,
  importMovieBody,
  listMoviesQuery,
  syncMoviesBody,
} from '../validators/movie.validator.js';
import { createReviewBody, listReviewsQuery, movieIdParams } from '../validators/review.validator.js';

export const createMovieRoutes = ({ movieController, reviewController, authenticate, authorize }) => {
  const router = Router();

  // ---- Catálogo local (público) ------------------------------------------
  router.get('/', validate({ query: listMoviesQuery }), movieController.list);
  router.get('/genres', movieController.genres);

  // ---- API externa (requieren sesión para proteger la cuota de OMDb) -----
  router.get(
    '/external/search',
    authenticate,
    validate({ query: externalSearchQuery }),
    movieController.searchExternal,
  );
  router.get('/imdb/:imdbId', authenticate, validate({ params: imdbIdParams }), movieController.getByImdbId);
  router.post('/import', authenticate, validate({ body: importMovieBody }), movieController.importMovie);
  router.post('/sync', authenticate, authorize(ROLES.ADMIN), validate({ body: syncMoviesBody }), movieController.sync);

  // ---- Detalle y borrado --------------------------------------------------
  router.get('/:id', validate({ params: idParams }), movieController.getById);
  router.delete('/:id', authenticate, authorize(ROLES.ADMIN), validate({ params: idParams }), movieController.remove);

  // ---- Reseñas de una película -------------------------------------------
  router.get(
    '/:movieId/reviews',
    validate({ params: movieIdParams, query: listReviewsQuery }),
    reviewController.listByMovie,
  );
  router.post(
    '/:movieId/reviews',
    authenticate,
    validate({ params: movieIdParams, body: createReviewBody }),
    reviewController.create,
  );

  return router;
};
