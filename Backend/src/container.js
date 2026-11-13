import { config } from './config/env.js';
import { AuthController } from './controllers/auth.controller.js';
import { MovieController } from './controllers/movie.controller.js';
import { ReviewController } from './controllers/review.controller.js';
import { UserController } from './controllers/user.controller.js';
import { OmdbClient } from './integrations/omdb/omdb.client.js';
import { OmdbProvider } from './integrations/omdb/omdb.provider.js';
import { authorize } from './middlewares/authorize.js';
import { createAuthenticate } from './middlewares/authenticate.js';
import { AuthService } from './services/auth.service.js';
import { MovieService } from './services/movie.service.js';
import { RatingService } from './services/rating.service.js';
import { ReviewService } from './services/review.service.js';
import { UserService } from './services/user.service.js';

/**
 * Único lugar donde se "conectan" las piezas (inyección de dependencias).
 * Cada clase recibe lo que necesita por el constructor, así que se puede
 * cambiar una pieza (ej: otro proveedor de películas) sin tocar las demás.
 *
 * `overrides` permite reemplazar piezas, por ejemplo en pruebas:
 *   buildContainer({ movieProvider: fakeProvider })
 */
export const buildContainer = (overrides = {}) => {
  const movieProvider =
    overrides.movieProvider ?? new OmdbProvider({ client: new OmdbClient(config.omdb) });

  // Servicios (de menos a más dependencias)
  const ratingService = new RatingService();
  const reviewService = new ReviewService({ ratingService });
  const userService = new UserService({ reviewService });
  const authService = new AuthService({ userService, jwtConfig: config.jwt });
  const movieService = new MovieService({ movieProvider, reviewService });

  return {
    // Los scripts (ej: seed de películas) usan los servicios directamente, sin pasar por HTTP.
    services: { movieService, reviewService, userService, authService },
    controllers: {
      authController: new AuthController({ authService }),
      userController: new UserController({ userService }),
      movieController: new MovieController({ movieService }),
      reviewController: new ReviewController({ reviewService }),
    },
    middlewares: {
      authenticate: createAuthenticate(authService),
      authorize,
    },
  };
};
