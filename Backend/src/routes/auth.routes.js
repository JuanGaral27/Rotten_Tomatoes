import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { loginBody, registerBody } from '../validators/auth.validator.js';

export const createAuthRoutes = ({ authController, authenticate }) => {
  const router = Router();

  router.post('/register', validate({ body: registerBody }), authController.register);
  router.post('/login', validate({ body: loginBody }), authController.login);
  router.get('/me', authenticate, authController.me);

  return router;
};
