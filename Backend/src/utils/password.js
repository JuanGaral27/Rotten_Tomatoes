import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';

export const hashPassword = (plain) => bcrypt.hash(plain, config.bcrypt.saltRounds);

export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);
