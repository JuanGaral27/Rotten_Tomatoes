import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { paginate } from '../utils/pagination.js';
import { hashPassword } from '../utils/password.js';
import { assertOwnerOrAdmin, isAdmin } from '../utils/permissions.js';

export class UserService {
  constructor({ reviewService }) {
    this.reviewService = reviewService;
  }

  async create({ username, email, password, role }) {
    const passwordHash = await hashPassword(password);
    return User.create({ username, email, password: passwordHash, role });
  }

  list({ page, limit, role, q }) {
    const filter = {};
    if (role) filter.role = role;
    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ username: regex }, { email: regex }];
    }
    return paginate({ model: User, filter, sort: { createdAt: -1 }, page, limit });
  }

  // Sin chequeo de permisos: uso interno (autenticación).
  findById(id) {
    return User.findById(id);
  }

  findByEmailWithPassword(email) {
    return User.findOne({ email }).select('+password');
  }

  async getById(id, actor) {
    assertOwnerOrAdmin(actor, id);
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound('Usuario no encontrado');
    return user;
  }

  async update(id, changes, actor) {
    assertOwnerOrAdmin(actor, id);
    if (changes.role !== undefined && !isAdmin(actor)) {
      throw ApiError.forbidden('Solo un administrador puede cambiar roles');
    }

    const user = await User.findById(id).select('+password');
    if (!user) throw ApiError.notFound('Usuario no encontrado');

    const previousRole = user.role;
    const { password, ...profileChanges } = changes;

    user.set(profileChanges);
    if (password) user.password = await hashPassword(password);
    await user.save();

    if (user.role !== previousRole) await this.reviewService.syncReviewerType(user);
    return user;
  }

  async remove(id, actor) {
    assertOwnerOrAdmin(actor, id);
    if (!(await User.exists({ _id: id }))) throw ApiError.notFound('Usuario no encontrado');

    // Primero sus reseñas (y se recalculan los puntajes), luego el usuario.
    await this.reviewService.deleteByUser(id);
    await User.deleteOne({ _id: id });
  }
}
