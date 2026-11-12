import { ApiError } from '../../utils/ApiError.js';

const PLOT_LENGTH = 'short'; // sinopsis breve

// Mensajes de OMDb que significan "no hay resultados" (no son un fallo real).
const NOT_FOUND_MESSAGES = new Set([
  'Movie not found!',
  'Series not found!',
  'Incorrect IMDb ID.',
  'Too many results.',
]);

/**
 * Cliente HTTP de bajo nivel para OMDb. Solo sabe hablar con la API:
 * devuelve el JSON crudo (o null si no hay resultados) y traduce los
 * fallos a ApiError. No conoce nuestros modelos.
 */
export class OmdbClient {
  constructor({ apiKey, baseUrl, timeoutMs, fetchImpl = globalThis.fetch }) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
    this.fetchImpl = fetchImpl;
  }

  getById(imdbId) {
    return this.#request({ i: imdbId, plot: PLOT_LENGTH });
  }

  getByTitle({ title, year, type }) {
    return this.#request({ t: title, y: year, type, plot: PLOT_LENGTH });
  }

  search({ query, type, year, page }) {
    return this.#request({ s: query, type, y: year, page });
  }

  async #request(params) {
    if (!this.apiKey) {
      throw ApiError.serviceUnavailable(
        'La API key de OMDb no está configurada (variable OMDB_API_KEY en el .env)',
        { code: 'OMDB_NOT_CONFIGURED' },
      );
    }

    const url = new URL(this.baseUrl);
    const query = { apikey: this.apiKey, r: 'json', ...params };
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    let payload;
    try {
      const response = await this.fetchImpl(url, { signal: AbortSignal.timeout(this.timeoutMs) });
      payload = await response.json();
    } catch {
      throw ApiError.badGateway('No se pudo obtener respuesta de OMDb', { code: 'OMDB_UNREACHABLE' });
    }

    if (payload?.Response !== 'False') return payload;
    return this.#handleApiError(payload.Error);
  }

  #handleApiError(message = '') {
    if (NOT_FOUND_MESSAGES.has(message)) return null;

    if (/invalid api key/i.test(message)) {
      throw ApiError.badGateway('OMDb rechazó la API key. Verifica OMDB_API_KEY.', {
        code: 'OMDB_INVALID_API_KEY',
      });
    }
    if (/limit reached/i.test(message)) {
      throw ApiError.tooManyRequests('Se alcanzó el límite diario de peticiones de OMDb', {
        code: 'OMDB_RATE_LIMIT',
      });
    }
    throw ApiError.badGateway(`OMDb respondió con un error: ${message}`, { code: 'OMDB_ERROR' });
  }
}
