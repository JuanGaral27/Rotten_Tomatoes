import { z } from 'zod';
import { PASSWORD, ROLES, ROLE_VALUES, USERNAME } from '../config/constants.js';
import { paginationQuery } from './common.validator.js';

export const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME.MIN_LENGTH)
  .max(USERNAME.MAX_LENGTH)
  .regex(USERNAME.PATTERN, 'Solo se permiten letras, números, punto, guion y guion bajo');

// Normaliza (trim + minúsculas) y luego valida el formato.
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Email inválido'));

export const passwordSchema = z.string().min(PASSWORD.MIN_LENGTH).max(PASSWORD.MAX_LENGTH);

// Crear usuario como administrador (puede asignar rol).
export const createUserBody = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(ROLE_VALUES).default(ROLES.USER),
});

export const updateUserBody = z
  .object({
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    role: z.enum(ROLE_VALUES).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'Envía al menos un campo para actualizar' });

export const listUsersQuery = paginationQuery.extend({
  role: z.enum(ROLE_VALUES).optional(),
  q: z.string().trim().min(1).optional(),
});
