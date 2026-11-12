import { REVIEWER_TYPE_VALUES } from '../config/constants.js';
import { Movie } from '../models/movie.model.js';
import { Review } from '../models/review.model.js';

const roundToOneDecimal = (value) => Math.round(value * 10) / 10;

/**
 * Función pura: recibe [{ reviewerType, rating }] y devuelve
 *   { user: { average, count }, critic: { average, count } }
 * (average = null cuando no hay reseñas de ese tipo).
 */
export const computeRatingStats = (reviews) => {
  const totals = Object.fromEntries(REVIEWER_TYPE_VALUES.map((type) => [type, { sum: 0, count: 0 }]));

  for (const { reviewerType, rating } of reviews) {
    totals[reviewerType].sum += rating;
    totals[reviewerType].count += 1;
  }

  return Object.fromEntries(
    Object.entries(totals).map(([type, { sum, count }]) => [
      type,
      { average: count > 0 ? roundToOneDecimal(sum / count) : null, count },
    ]),
  );
};

/**
 * Mantiene al día los puntajes agregados de cada película
 * (promedio de usuarios normales vs. promedio de críticos).
 */
export class RatingService {
  async recalculateForMovie(movieId) {
    const reviews = await Review.find({ movie: movieId }).select('reviewerType rating').lean();
    const ratings = computeRatingStats(reviews);

    await Movie.updateOne({ _id: movieId }, { $set: { ratings } });
    return ratings;
  }

  recalculateForMovies(movieIds) {
    return Promise.all(movieIds.map((movieId) => this.recalculateForMovie(movieId)));
  }
}
