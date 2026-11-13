import { MediaType, MovieSortBy, RatingSource, SortOrder } from '../models/movie.models';
import { ReviewerType } from '../models/review.models';
import { Role } from '../models/user.models';

/** Reglas que reflejan las del backend (backend/src/config/constants.js). */
export const SCORE = { MIN: 0, MAX: 10, STEP: 0.5 } as const;
export const REVIEW_COMMENT = { MIN_LENGTH: 3, MAX_LENGTH: 500 } as const;
export const PASSWORD = { MIN_LENGTH: 8, MAX_LENGTH: 16 } as const;
export const USERNAME = { MIN_LENGTH: 3, MAX_LENGTH: 20, PATTERN: /^[a-zA-Z0-9_.-]+$/ } as const;
export const EMAIL = {
  MAX_LENGTH: 60,
  PATTERN: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/,
} as const;
export const SEARCH_TEXT = { MAX_LENGTH: 100 } as const;
export const NAME_TEXT = { MAX_LENGTH: 100 } as const;
export const PAGE_SIZE = 12;

export const STORAGE_KEYS = { TOKEN: 'rt.token', USER: 'rt.user' } as const;

export interface Option<T> {
  value: T;
  label: string;
}

export const MEDIA_TYPE_OPTIONS: Option<MediaType>[] = [
  { value: 'movie', label: 'Películas' },
  { value: 'series', label: 'Series' },
];

export const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  movie: 'Película',
  series: 'Serie',
  episode: 'Episodio',
};

export const RATING_SOURCE_OPTIONS: Option<RatingSource>[] = [
  { value: 'imdb', label: 'IMDb' },
  { value: 'user', label: 'Usuarios' },
  { value: 'critic', label: 'Críticos' },
];

export const SORT_OPTIONS: Option<MovieSortBy>[] = [
  { value: 'date', label: 'Fecha' },
  { value: 'rating', label: 'Puntaje' },
  { value: 'title', label: 'Título' },
];

/** Orden por defecto de Explorar: lo más votado primero. */
export const POPULAR_SORT: { sortBy: MovieSortBy; order: SortOrder } = { sortBy: 'popularity', order: 'desc' };

export const DEFAULT_SORT: { sortBy: MovieSortBy; order: SortOrder } = { sortBy: 'date', order: 'desc' };

export const ROLE_OPTIONS: Option<Role>[] = [
  { value: 'user', label: 'Usuario' },
  { value: 'critic', label: 'Crítico' },
  { value: 'admin', label: 'Administrador' },
];

export const ROLE_LABEL: Record<Role, string> = {
  user: 'Usuario',
  critic: 'Crítico',
  admin: 'Administrador',
};

export const REVIEWER_LABEL: Record<ReviewerType, string> = {
  user: 'Usuarios',
  critic: 'Críticos',
};
