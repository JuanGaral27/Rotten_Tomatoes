import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { createAuthRoutes } from './auth.routes.js';
import { createMovieRoutes } from './movie.routes.js';
import { createReviewRoutes } from './review.routes.js';
import { createUserRoutes } from './user.routes.js';

export const createApiRouter = ({ controllers, middlewares, getDatabaseStatus }) => {
  const router = Router();
  const deps = { ...controllers, ...middlewares };

  // Sirve para comprobar que el servidor está arriba y la base de datos conectada.
  router.get('/health', (_req, res) => {
    const database = getDatabaseStatus();
    const payload = { status: database === 'connected' ? 'ok' : 'degraded', database, uptime: process.uptime() };
    if (database === 'connected') return sendOk(res, payload);
    res.status(503).json({ success: false, data: payload });
  });

  router.use('/auth', createAuthRoutes(deps));
  router.use('/users', createUserRoutes(deps));
  router.use('/movies', createMovieRoutes(deps));
  router.use('/reviews', createReviewRoutes(deps));

  return router;
};
