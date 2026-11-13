import { DEFAULT_RATING_SOURCE, DEFAULT_SORT_ORDER, POPULARITY_FIELD, RATING_SOURCES } from '../config/constants.js';
import { escapeRegex } from '../utils/escapeRegex.js';

/**
 * Traduce los filtros validados de la URL a un filtro/orden de MongoDB.
 * Está separado del servicio para poder reutilizarlo y probarlo solo.
 */

const containsText = (text) => new RegExp(escapeRegex(text), 'i');
const exactTextIgnoreCase = (text) => new RegExp(`^${escapeRegex(text)}$`, 'i');

const ratingField = (source = DEFAULT_RATING_SOURCE) => RATING_SOURCES[source].field;

const rangeOf = (min, max) => ({
  ...(min !== undefined && { $gte: min }),
  ...(max !== undefined && { $lte: max }),
});

export const buildMovieFilter = (filters) => {
  const filter = {};

  if (filters.q) filter.title = containsText(filters.q);
  if (filters.type) filter.mediaType = filters.type;
  if (filters.genre?.length) filter.genres = { $in: filters.genre.map(exactTextIgnoreCase) };
  if (filters.actor) filter.actors = containsText(filters.actor);
  if (filters.year) filter.year = filters.year;

  if (filters.releasedFrom || filters.releasedTo) {
    filter.released = rangeOf(filters.releasedFrom, filters.releasedTo);
  }

  if (filters.minRating !== undefined || filters.maxRating !== undefined) {
    filter[ratingField(filters.ratingSource)] = rangeOf(filters.minRating, filters.maxRating);
  }

  return filter;
};

// Cada criterio de orden sabe qué campo de la película usar.
const SORT_FIELD_RESOLVERS = {
  date: () => 'released',
  title: () => 'title',
  popularity: () => POPULARITY_FIELD,
  rating: ({ ratingSource }) => ratingField(ratingSource),
};

export const buildMovieSort = (filters) => {
  const sortBy = filters.sortBy ?? 'date';
  const order = filters.order ?? DEFAULT_SORT_ORDER[sortBy];
  const field = SORT_FIELD_RESOLVERS[sortBy](filters);

  // _id como desempate para que la paginación sea estable.
  return { [field]: order === 'asc' ? 1 : -1, _id: 1 };
};
