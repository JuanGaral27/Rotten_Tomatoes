import mongoose from 'mongoose';
import { EMAIL, ROLES, ROLE_VALUES, USERNAME } from '../config/constants.js';
import { normalizeJson } from './plugins/normalizeJson.js';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: USERNAME.MIN_LENGTH,
      maxlength: USERNAME.MAX_LENGTH,
      match: USERNAME.PATTERN,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: EMAIL.MAX_LENGTH, match: EMAIL.PATTERN },
    // Guarda el hash (bcrypt), nunca la contraseña en claro. No se devuelve por defecto.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: [...ROLE_VALUES], default: ROLES.USER, index: true },
  },
  { timestamps: true },
);

userSchema.plugin(normalizeJson);

export const User = mongoose.model('User', userSchema);
