export type MediaType = 'movie' | 'series' | 'episode';
export type RatingSource = 'user' | 'critic' | 'imdb';
export type MovieSortBy = 'date' | 'rating' | 'title';
export type SortOrder = 'asc' | 'desc';

export interface RatingStat {
  average: number | null;
  count: number;
}

export interface Movie {
  id: string;
  imdbId: string;
  title: string;
  mediaType: MediaType;
  year: number | null;
  released: string | null;
  rated: string | null;
  runtime: number | null;
  genres: string[];
  directors: string[];
  writers: string[];
  actors: string[];
  languages: string[];
  countries: string[];
  plot: string | null;
  awards: string | null;
  poster: string | null;
  externalRatings: {
    imdb: { rating: number | null; votes: number | null };
    metascore: number | null;
    rottenTomatoes: number | null;
  };
  /** Puntajes de NUESTRA app: usuarios normales vs críticos. */
  ratings: { user: RatingStat; critic: RatingStat };
}

/** Filtros del catálogo (se envían como query params a GET /movies). */
export interface MovieFilters {
  q?: string;
  genre?: string[];
  type?: MediaType;
  actor?: string;
  year?: number;
  releasedFrom?: string;
  releasedTo?: string;
  minRating?: number;
  maxRating?: number;
  ratingSource?: RatingSource;
  sortBy?: MovieSortBy;
  order?: SortOrder;
}

/** Resultado de buscar en la API externa (OMDb). */
export interface ExternalMovie {
  imdbId: string;
  title: string;
  year: number | null;
  mediaType: MediaType;
  poster: string | null;
  inDatabase: boolean;
  movieId: string | null;
}

export interface ExternalSearchFilters {
  q: string;
  type?: MediaType;
  year?: number;
}

export interface ImportResult {
  movie: Movie;
  created: boolean;
}
