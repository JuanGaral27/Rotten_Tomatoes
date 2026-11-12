import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.validator.js';
import { updateReviewBody } from '../validators/review.validator.js';

export const createReviewRoutes = ({ reviewController, authenticate }) => {
  const router = Router();

  // Crear y listar reseñas vive bajo /movies/:movieId/reviews (ver movie.routes.js).
  router.get('/:id', validate({ params: idParams }), reviewController.getById);
  router.patch('/:id', authenticate, validate({ params: idParams, body: updateReviewBody }), reviewController.update);
  router.delete('/:id', authenticate, validate({ params: idParams }), reviewController.remove);

  return router;
};
