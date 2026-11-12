import { ROLES } from '../config/constants.js';
import { ApiError } from './ApiError.js';

export const isAdmin = (actor) => actor?.role === ROLES.ADMIN;

export const isOwnerOrAdmin = (actor, ownerId) =>
  isAdmin(actor) || (actor?.id !== undefined && String(actor.id) === String(ownerId));

export const assertOwnerOrAdmin = (actor, ownerId) => {
  if (!isOwnerOrAdmin(actor, ownerId)) {
    throw ApiError.forbidden('Solo el dueño del recurso o un administrador puede hacer esto');
  }
};
