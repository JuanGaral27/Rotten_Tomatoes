import { Router } from 'express';
import { ROLES } from '../config/constants.js';
import { validate } from '../middlewares/validate.js';
import { idParams, paginationQuery } from '../validators/common.validator.js';
import { createUserBody, listUsersQuery, updateUserBody } from '../validators/user.validator.js';

export const createUserRoutes = ({ userController, reviewController, authenticate, authorize }) => {
  const router = Router();

  // CRUD de usuarios (crear/listar: solo admin; ver/editar/borrar: dueño o admin).
  router.post('/', authenticate, authorize(ROLES.ADMIN), validate({ body: createUserBody }), userController.create);
  router.get('/', authenticate, authorize(ROLES.ADMIN), validate({ query: listUsersQuery }), userController.list);
  router.get('/:id', authenticate, validate({ params: idParams }), userController.getById);
  router.patch('/:id', authenticate, validate({ params: idParams, body: updateUserBody }), userController.update);
  router.delete('/:id', authenticate, validate({ params: idParams }), userController.remove);

  // Reseñas hechas por un usuario (público).
  router.get(
    '/:id/reviews',
    validate({ params: idParams, query: paginationQuery }),
    reviewController.listByUser,
  );

  return router;
};
