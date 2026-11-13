import { z } from 'zod';
import { EMAIL, PASSWORD, ROLES, ROLE_VALUES, SEARCH_TEXT, USERNAME } from '../config/constants.js';
import { paginationQuery } from './common.validator.js';

export const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME.MIN_LENGTH)
  .max(USERNAME.MAX_LENGTH)
  .regex(USERNAME.PATTERN, 'Solo se permiten letras, números, punto, guion y guion bajo');

// Normaliza (trim + minúsculas), limita el largo y exige el formato algo@dominio.ext
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(EMAIL.MAX_LENGTH, `El correo no puede superar ${EMAIL.MAX_LENGTH} caracteres`)
  .regex(EMAIL.PATTERN, 'Correo inválido (ejemplo: nombre@dominio.com)');

export const passwordSchema = z
  .string()
  .min(PASSWORD.MIN_LENGTH, `La clave debe tener al menos ${PASSWORD.MIN_LENGTH} caracteres`)
  .max(PASSWORD.MAX_LENGTH, `La clave no puede superar ${PASSWORD.MAX_LENGTH} caracteres`);

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
  q: z.string().trim().min(1).max(SEARCH_TEXT.MAX_LENGTH).optional(),
});
