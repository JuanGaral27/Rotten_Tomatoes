import { sendCreated, sendNoContent, sendOk } from '../utils/response.js';

// 201 si la película se acaba de guardar desde la API externa, 200 si ya existía.
const sendImportResult = (res, { movie, created }) =>
  created ? sendCreated(res, movie, { created }) : sendOk(res, movie, { created });

export class MovieController {
  constructor({ movieService }) {
    this.movieService = movieService;
  }

  list = async (req, res) => {
    const { items, pagination } = await this.movieService.list(req.valid.query);
    sendOk(res, items, { pagination });
  };

  genres = async (_req, res) => {
    sendOk(res, await this.movieService.listGenres());
  };

  getById = async (req, res) => {
    sendOk(res, await this.movieService.getById(req.valid.params.id));
  };

  getByImdbId = async (req, res) => {
    sendImportResult(res, await this.movieService.importByImdbId(req.valid.params.imdbId));
  };

  searchExternal = async (req, res) => {
    const { items, pagination } = await this.movieService.searchExternal(req.valid.query);
    sendOk(res, items, { pagination });
  };

  importMovie = async (req, res) => {
    const { imdbId, title, year, type } = req.valid.body;
    const result = imdbId
      ? await this.movieService.importByImdbId(imdbId)
      : await this.movieService.importByTitle({ title, year, type });
    sendImportResult(res, result);
  };

  sync = async (req, res) => {
    sendOk(res, await this.movieService.syncFromSearch(req.valid.body));
  };

  remove = async (req, res) => {
    await this.movieService.remove(req.valid.params.id);
    sendNoContent(res);
  };
}
