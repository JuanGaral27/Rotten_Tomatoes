import { REVIEWER_TYPE_BY_ROLE } from '../config/constants.js';
import { Movie } from '../models/movie.model.js';
import { Review } from '../models/review.model.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate } from '../utils/pagination.js';
import { assertOwnerOrAdmin } from '../utils/permissions.js';

const USER_FIELDS = 'username role';
const MOVIE_FIELDS = 'title year poster imdbId mediaType';
const SORT_FIELDS = { date: 'createdAt', rating: 'rating' };

export class ReviewService {
  constructor({ ratingService }) {
    this.ratingService = ratingService;
  }

  async create({ movieId, actor, rating, comment }) {
    await this.#assertMovieExists(movieId);

    let review;
    try {
      review = await Review.create({
        movie: movieId,
        user: actor.id,
        rating,
        comment,
        reviewerType: REVIEWER_TYPE_BY_ROLE[actor.role],
      });
    } catch (error) {
      if (error.code === 11000) {
        throw ApiError.conflict('Ya reseñaste esta película/serie. Edita tu reseña existente.', {
          code: 'REVIEW_ALREADY_EXISTS',
        });
      }
      throw error;
    }

    await this.ratingService.recalculateForMovie(movieId);
    return review.populate('user', USER_FIELDS);
  }

  async listByMovie(movieId, { reviewerType, sortBy, order, page, limit }) {
    await this.#assertMovieExists(movieId);

    const filter = { movie: movieId };
    if (reviewerType) filter.reviewerType = reviewerType;

    return paginate({
      model: Review,
      filter,
      sort: { [SORT_FIELDS[sortBy]]: order === 'asc' ? 1 : -1, _id: -1 },
      page,
      limit,
      populate: { path: 'user', select: USER_FIELDS },
    });
  }

  listByUser(userId, { page, limit }) {
    return paginate({
      model: Review,
      filter: { user: userId },
      sort: { createdAt: -1, _id: -1 },
      page,
      limit,
      populate: { path: 'movie', select: MOVIE_FIELDS },
    });
  }

  async getById(id) {
    const review = await Review.findById(id)
      .populate('user', USER_FIELDS)
      .populate('movie', MOVIE_FIELDS);
    if (!review) throw ApiError.notFound('Reseña no encontrada');
    return review;
  }

  async update(id, changes, actor) {
    const review = await this.#findOrFail(id);
    assertOwnerOrAdmin(actor, review.user);

    review.set(changes);
    await review.save();

    await this.ratingService.recalculateForMovie(review.movie);
    return review.populate('user', USER_FIELDS);
  }

  async remove(id, actor) {
    const review = await this.#findOrFail(id);
    assertOwnerOrAdmin(actor, review.user);

    await review.deleteOne();
    await this.ratingService.recalculateForMovie(review.movie);
  }

  // ---- Operaciones en cascada (las usan MovieService y UserService) ------

  async deleteByMovie(movieId) {
    await Review.deleteMany({ movie: movieId });
  }

  async deleteByUser(userId) {
    const movieIds = await Review.distinct('movie', { user: userId });
    await Review.deleteMany({ user: userId });
    await this.ratingService.recalculateForMovies(movieIds);
  }

  /** Si cambia el rol de un usuario, sus reseñas pasan a contar como "user" o "critic". */
  async syncReviewerType(user) {
    const reviewerType = REVIEWER_TYPE_BY_ROLE[user.role];
    const movieIds = await Review.distinct('movie', { user: user.id, reviewerType: { $ne: reviewerType } });
    if (movieIds.length === 0) return;

    await Review.updateMany({ user: user.id }, { $set: { reviewerType } });
    await this.ratingService.recalculateForMovies(movieIds);
  }

  // ---- Privados ----------------------------------------------------------

  async #assertMovieExists(movieId) {
    if (!(await Movie.exists({ _id: movieId }))) throw ApiError.notFound('Película o serie no encontrada');
  }

  async #findOrFail(id) {
    const review = await Review.findById(id);
    if (!review) throw ApiError.notFound('Reseña no encontrada');
    return review;
  }
}
