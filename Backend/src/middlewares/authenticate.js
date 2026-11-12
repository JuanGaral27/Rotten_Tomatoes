import { ApiError } from '../utils/ApiError.js';

const extractBearerToken = (header = '') => {
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
};

/** Exige "Authorization: Bearer <token>" y deja el usuario en `req.user`. */
export const createAuthenticate = (authService) => async (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    return next(
      ApiError.unauthorized('Falta el token (header Authorization: Bearer <token>)', { code: 'MISSING_TOKEN' }),
    );
  }

  try {
    req.user = await authService.authenticate(token);
    next();
  } catch (error) {
    next(error);
  }
};
