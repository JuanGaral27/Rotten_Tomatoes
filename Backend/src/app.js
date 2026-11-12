import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import { createApiRouter } from './routes/index.js';

/** Construye la app de Express (sin conectarse a nada ni escuchar puertos). */
export const createApp = ({ controllers, middlewares, getDatabaseStatus }) => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.cors.origin }));
  app.use(express.json({ limit: '1mb' }));
  if (!config.isTest) app.use(morgan('dev'));

  app.use('/api', createApiRouter({ controllers, middlewares, getDatabaseStatus }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
