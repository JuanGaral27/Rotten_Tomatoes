import { sendCreated, sendOk } from '../utils/response.js';

export class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  register = async (req, res) => {
    const result = await this.authService.register(req.valid.body);
    sendCreated(res, result);
  };

  login = async (req, res) => {
    const result = await this.authService.login(req.valid.body);
    sendOk(res, result);
  };

  me = async (req, res) => {
    sendOk(res, req.user);
  };
}
