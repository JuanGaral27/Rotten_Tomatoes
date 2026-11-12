import { sendCreated, sendNoContent, sendOk } from '../utils/response.js';

export class UserController {
  constructor({ userService }) {
    this.userService = userService;
  }

  create = async (req, res) => {
    const user = await this.userService.create(req.valid.body);
    sendCreated(res, user);
  };

  list = async (req, res) => {
    const { items, pagination } = await this.userService.list(req.valid.query);
    sendOk(res, items, { pagination });
  };

  getById = async (req, res) => {
    const user = await this.userService.getById(req.valid.params.id, req.user);
    sendOk(res, user);
  };

  update = async (req, res) => {
    const user = await this.userService.update(req.valid.params.id, req.valid.body, req.user);
    sendOk(res, user);
  };

  remove = async (req, res) => {
    await this.userService.remove(req.valid.params.id, req.user);
    sendNoContent(res);
  };
}
