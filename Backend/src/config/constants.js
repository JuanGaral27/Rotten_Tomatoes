/**
 * Constantes de dominio. Ningún otro archivo debe repetir estos valores:
 * se importan desde aquí (modelos, validadores, servicios, queries).
 */

// ---- Roles y tipo de reseñador -------------------------------------------
export const ROLES = Object.freeze({ USER: 'user', CRITIC: 'critic', ADMIN: 'admin' });
export const ROLE_VALUES = Object.values(ROLES);

export const REVIEWER_TYPES = Object.freeze({ USER: 'user', CRITIC: 'critic' });
export const REVIEWER_TYPE_VALUES = Object.values(REVIEWER_TYPES);

// Qué "tipo de puntaje" aporta cada rol. El admin puntúa como usuario normal.
export const REVIEWER_TYPE_BY_ROLE = Object.freeze({
  [ROLES.USER]: REVIEWER_TYPES.USER,
  [ROLES.CRITIC]: REVIEWER_TYPES.CRITIC,
  [ROLES.ADMIN]: REVIEWER_TYPES.USER,
});

// ---- Películas / series --------------------------------------------------
export const MEDIA_TYPES = Object.freeze({ MOVIE: 'movie', SERIES: 'series', EPISODE: 'episode' });
export const MEDIA_TYPE_VALUES = Object.values(MEDIA_TYPES);

// ---- Reseñas -------------------------------------------------------------
export const SCORE = Object.freeze({ MIN: 0, MAX: 10, STEP: 0.5 });
export const REVIEW_COMMENT = Object.freeze({ MIN_LENGTH: 3, MAX_LENGTH: 500 });

// ---- Usuarios ------------------------------------------------------------
export const USERNAME = Object.freeze({ MIN_LENGTH: 3, MAX_LENGTH: 20, PATTERN: /^[a-zA-Z0-9_.-]+$/ });
export const PASSWORD = Object.freeze({ MIN_LENGTH: 8, MAX_LENGTH: 16 });
// Formato obligatorio: algo@dominio.ext  (con punto y extensión de 2+ letras)
export const EMAIL = Object.freeze({
  MAX_LENGTH: 60,
  PATTERN: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/,
});

// ---- Límites de texto en búsquedas y filtros -----------------------------
export const SEARCH_TEXT = Object.freeze({ MAX_LENGTH: 100 }); // q, actor, etc.
export const TITLE_TEXT = Object.freeze({ MAX_LENGTH: 150 }); // título para importar de OMDb
export const GENRE_FILTER = Object.freeze({ MAX_ITEMS: 10, ITEM_MAX_LENGTH: 40 });

// ---- Paginación ----------------------------------------------------------
export const PAGINATION = Object.freeze({ DEFAULT_PAGE: 1, DEFAULT_LIMIT: 10, MAX_LIMIT: 50 });

// ---- Puntajes y ordenamiento de películas --------------------------------
// De qué campo de la película sale cada "fuente" de puntaje.
export const RATING_SOURCES = Object.freeze({
  user: { field: 'ratings.user.average' },
  critic: { field: 'ratings.critic.average' },
  imdb: { field: 'externalRatings.imdb.rating' },
});
export const RATING_SOURCE_KEYS = Object.keys(RATING_SOURCES);
export const DEFAULT_RATING_SOURCE = 'imdb';

// "popularity" = más votos en IMDb (sirve para "las más vistas / con más calificaciones").
export const POPULARITY_FIELD = 'externalRatings.imdb.votes';
export const MOVIE_SORT_KEYS = ['date', 'rating', 'title', 'popularity'];
export const DEFAULT_SORT_ORDER = Object.freeze({ date: 'desc', rating: 'desc', title: 'asc', popularity: 'desc' });

// ---- Importación desde la API externa ------------------------------------
export const IMPORT_CONCURRENCY = 5;
