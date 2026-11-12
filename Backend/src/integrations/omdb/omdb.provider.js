import { mapOmdbMovie, mapOmdbSearchItem } from './omdb.mapper.js';

const OMDB_PAGE_SIZE = 10;

/**
 * Adaptador que implementa el "contrato de proveedor de películas" que
 * espera MovieService:
 *
 *   getByImdbId(imdbId)                    -> película normalizada | null
 *   getByTitle({ title, year, type })      -> película normalizada | null
 *   search({ query, type, year, page })    -> { items, total, page, pageSize }
 *
 * Si mañana quieres usar otra API (TMDB, etc.), escribes otro proveedor con
 * estos 3 métodos y lo registras en container.js. El resto no cambia.
 */
export class OmdbProvider {
  constructor({ client }) {
    this.client = client;
  }

  async getByImdbId(imdbId) {
    const raw = await this.client.getById(imdbId);
    return raw ? mapOmdbMovie(raw) : null;
  }

  async getByTitle({ title, year, type }) {
    const raw = await this.client.getByTitle({ title, year, type });
    return raw ? mapOmdbMovie(raw) : null;
  }

  async search({ query, type, year, page = 1 }) {
    const raw = await this.client.search({ query, type, year, page });
    const results = raw?.Search ?? [];
    return {
      items: results.map(mapOmdbSearchItem),
      total: Number(raw?.totalResults) || results.length,
      page,
      pageSize: OMDB_PAGE_SIZE,
    };
  }
}
