import { z } from 'zod';
import { emailSchema, passwordSchema, usernameSchema } from './user.validator.js';

// El registro público NO acepta "role": todos nacen como usuario normal.
export const registerBody = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginBody = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria'),
});
