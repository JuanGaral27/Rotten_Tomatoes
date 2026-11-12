import { IMPORT_CONCURRENCY } from '../config/constants.js';
import { Movie } from '../models/movie.model.js';
import { buildMovieFilter, buildMovieSort } from '../queries/movie.query.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPagination, paginate } from '../utils/pagination.js';

/**
 * Catálogo de películas/series.
 *
 * `movieProvider` es la fuente externa (hoy OMDb). MovieService solo conoce
 * su contrato (getByImdbId / getByTitle / search), no la API concreta.
 */
export class MovieService {
  constructor({ movieProvider, reviewService }) {
    this.movieProvider = movieProvider;
    this.reviewService = reviewService;
  }

  // ---- Consulta sobre nuestra base de datos ------------------------------

  list(filters) {
    return paginate({
      model: Movie,
      filter: buildMovieFilter(filters),
      sort: buildMovieSort(filters),
      page: filters.page,
      limit: filters.limit,
    });
  }

  async listGenres() {
    const genres = await Movie.distinct('genres');
    return genres.sort((a, b) => a.localeCompare(b));
  }

  async getById(id) {
    const movie = await Movie.findById(id);
    if (!movie) throw ApiError.notFound('Película o serie no encontrada');
    return movie;
  }

  async remove(id) {
    if (!(await Movie.exists({ _id: id }))) throw ApiError.notFound('Película o serie no encontrada');
    await this.reviewService.deleteByMovie(id);
    await Movie.deleteOne({ _id: id });
  }

  // ---- Integración con la API externa ------------------------------------

  /** Busca en la API externa (sin guardar) y marca cuáles ya están en nuestra BD. */
  async searchExternal({ q, type, year, page }) {
    const { items, total, pageSize } = await this.movieProvider.search({ query: q, type, year, page });

    const saved = await Movie.find({ imdbId: { $in: items.map((item) => item.imdbId) } }).select('imdbId');
    const savedIds = new Map(saved.map((movie) => [movie.imdbId, movie.id]));

    return {
      items: items.map((item) => ({
        ...item,
        inDatabase: savedIds.has(item.imdbId),
        movieId: savedIds.get(item.imdbId) ?? null,
      })),
      pagination: buildPagination({ total, page, limit: pageSize }),
    };
  }

  /** Devuelve la película de nuestra BD; si no la tenemos, la trae de la API externa y la guarda. */
  importByImdbId(imdbId) {
    return this.#findOrImport(imdbId, () => this.movieProvider.getByImdbId(imdbId));
  }

  async importByTitle({ title, year, type }) {
    const data = await this.movieProvider.getByTitle({ title, year, type });
    if (!data) throw ApiError.notFound(`No se encontró "${title}" en la API externa`);

    const existing = await Movie.findOne({ imdbId: data.imdbId });
    return existing ? { movie: existing, created: false } : this.#persist(data);
  }

  /** Importa en bloque todos los resultados de una búsqueda que aún no estén guardados. */
  async syncFromSearch({ q, type, year, page }) {
    const { items } = await this.movieProvider.search({ query: q, type, year, page });

    const existing = await Movie.find({ imdbId: { $in: items.map((item) => item.imdbId) } }).select('imdbId');
    const existingIds = new Set(existing.map((movie) => movie.imdbId));
    const pending = items.filter((item) => !existingIds.has(item.imdbId));

    const imported = [];
    const failed = [];

    // En tandas pequeñas para no saturar la API externa.
    for (let start = 0; start < pending.length; start += IMPORT_CONCURRENCY) {
      const batch = pending.slice(start, start + IMPORT_CONCURRENCY);
      const outcomes = await Promise.allSettled(batch.map((item) => this.importByImdbId(item.imdbId)));

      outcomes.forEach((outcome, index) => {
        const { imdbId, title } = batch[index];
        if (outcome.status === 'fulfilled') imported.push({ imdbId, title });
        else failed.push({ imdbId, title, reason: outcome.reason?.message ?? 'Error desconocido' });
      });
    }

    return { found: items.length, alreadyInDatabase: existingIds.size, imported, failed };
  }

  // ---- Privados ----------------------------------------------------------

  async #findOrImport(imdbId, fetchFromProvider) {
    const existing = await Movie.findOne({ imdbId });
    if (existing) return { movie: existing, created: false };

    const data = await fetchFromProvider();
    if (!data) throw ApiError.notFound(`No se encontró "${imdbId}" en la API externa`);
    return this.#persist(data);
  }

  async #persist(data) {
    try {
      const movie = await Movie.create(data);
      return { movie, created: true };
    } catch (error) {
      // Dos peticiones importaron la misma película a la vez: devolvemos la que quedó guardada.
      if (error.code === 11000) {
        const movie = await Movie.findOne({ imdbId: data.imdbId });
        if (movie) return { movie, created: false };
      }
      throw error;
    }
  }
}
