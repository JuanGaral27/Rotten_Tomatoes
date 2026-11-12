import jwt from 'jsonwebtoken';
import { ROLES } from '../config/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyPassword } from '../utils/password.js';

export class AuthService {
  constructor({ userService, jwtConfig }) {
    this.userService = userService;
    this.jwtConfig = jwtConfig;
  }

  async register({ username, email, password }) {
    const user = await this.userService.create({ username, email, password, role: ROLES.USER });
    return { user, token: this.signToken(user) };
  }

  async login({ email, password }) {
    const user = await this.userService.findByEmailWithPassword(email);
    const isValid = user ? await verifyPassword(password, user.password) : false;

    // Mismo mensaje si falla el email o la contraseña (no revelar qué correos existen).
    if (!isValid) throw ApiError.unauthorized('Credenciales inválidas', { code: 'INVALID_CREDENTIALS' });

    return { user, token: this.signToken(user) };
  }

  signToken(user) {
    return jwt.sign({ role: user.role }, this.jwtConfig.secret, {
      subject: String(user.id),
      expiresIn: this.jwtConfig.expiresIn,
    });
  }

  /** Valida el token y devuelve el usuario ACTUAL de la BD (así los cambios de rol aplican al instante). */
  async authenticate(token) {
    let payload;
    try {
      payload = jwt.verify(token, this.jwtConfig.secret);
    } catch {
      throw ApiError.unauthorized('Token inválido o expirado', { code: 'INVALID_TOKEN' });
    }

    const user = await this.userService.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('El usuario de este token ya no existe', { code: 'INVALID_TOKEN' });
    return user;
  }
}
