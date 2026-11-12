import { sendCreated, sendNoContent, sendOk } from '../utils/response.js';

export class ReviewController {
  constructor({ reviewService }) {
    this.reviewService = reviewService;
  }

  create = async (req, res) => {
    const review = await this.reviewService.create({
      movieId: req.valid.params.movieId,
      actor: req.user,
      ...req.valid.body,
    });
    sendCreated(res, review);
  };

  listByMovie = async (req, res) => {
    const { items, pagination } = await this.reviewService.listByMovie(req.valid.params.movieId, req.valid.query);
    sendOk(res, items, { pagination });
  };

  listByUser = async (req, res) => {
    const { items, pagination } = await this.reviewService.listByUser(req.valid.params.id, req.valid.query);
    sendOk(res, items, { pagination });
  };

  getById = async (req, res) => {
    const review = await this.reviewService.getById(req.valid.params.id);
    sendOk(res, review);
  };

  update = async (req, res) => {
    const review = await this.reviewService.update(req.valid.params.id, req.valid.body, req.user);
    sendOk(res, review);
  };

  remove = async (req, res) => {
    await this.reviewService.remove(req.valid.params.id, req.user);
    sendNoContent(res);
  };
}
