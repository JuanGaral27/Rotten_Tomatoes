/**
 * Funciones puras que convierten el JSON de OMDb a nuestro formato.
 * OMDb usa "N/A" para valores vacíos y strings para casi todo.
 */

const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

const isEmpty = (value) => value === undefined || value === null || value === '' || value === 'N/A';

const toText = (value) => (isEmpty(value) ? null : String(value).trim());

const toList = (value) =>
  isEmpty(value)
    ? []
    : String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const toNumber = (value) => {
  if (isEmpty(value)) return null;
  const number = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(number) ? number : null;
};

// "21 Jul 2010" -> Date (UTC)
const toDate = (value) => {
  if (isEmpty(value)) return null;
  const match = /^(\d{1,2}) (\w{3}) (\d{4})$/.exec(String(value).trim());
  if (!match || MONTHS[match[2]] === undefined) return null;
  return new Date(Date.UTC(Number(match[3]), MONTHS[match[2]], Number(match[1])));
};

// "2010" | "2008–2013" | "2008–" -> 2010 / 2008
const toYear = (value) => {
  const match = /\d{4}/.exec(String(value ?? ''));
  return match ? Number(match[0]) : null;
};

// "148 min" -> 148
const toRuntimeMinutes = (value) => {
  const match = /(\d+)\s*min/i.exec(String(value ?? ''));
  return match ? Number(match[1]) : null;
};

// Ratings: [{ Source: "Rotten Tomatoes", Value: "87%" }, ...] -> 87
const findRatingValue = (ratings, source) => {
  const entry = Array.isArray(ratings) ? ratings.find((item) => item.Source === source) : null;
  return entry ? toNumber(String(entry.Value).replace('%', '')) : null;
};

/** Detalle completo de OMDb -> documento de película de nuestra BD. */
export const mapOmdbMovie = (raw) => ({
  imdbId: raw.imdbID,
  title: raw.Title,
  mediaType: toText(raw.Type)?.toLowerCase() ?? 'movie',
  year: toYear(raw.Year),
  released: toDate(raw.Released),
  rated: toText(raw.Rated),
  runtime: toRuntimeMinutes(raw.Runtime),
  genres: toList(raw.Genre),
  directors: toList(raw.Director),
  writers: toList(raw.Writer),
  actors: toList(raw.Actors),
  languages: toList(raw.Language),
  countries: toList(raw.Country),
  plot: toText(raw.Plot),
  awards: toText(raw.Awards),
  poster: toText(raw.Poster),
  externalRatings: {
    imdb: { rating: toNumber(raw.imdbRating), votes: toNumber(raw.imdbVotes) },
    metascore: toNumber(raw.Metascore),
    rottenTomatoes: findRatingValue(raw.Ratings, 'Rotten Tomatoes'),
  },
  source: 'omdb',
});

/** Item de una búsqueda de OMDb -> resumen ligero (sin guardar). */
export const mapOmdbSearchItem = (raw) => ({
  imdbId: raw.imdbID,
  title: raw.Title,
  year: toYear(raw.Year),
  mediaType: toText(raw.Type)?.toLowerCase() ?? 'movie',
  poster: toText(raw.Poster),
});
