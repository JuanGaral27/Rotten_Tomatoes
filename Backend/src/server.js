import { createApp } from './app.js';
import { config } from './config/env.js';
import {
  connectDatabase,
  describeConnectionError,
  disconnectDatabase,
  getDatabaseStatus,
} from './config/database.js';
import { buildContainer } from './container.js';

const start = async () => {
  try {
    await connectDatabase(config.mongo);
  } catch (error) {
    console.error(`[db] No se pudo conectar a MongoDB: ${error.message}`);
    describeConnectionError(error).forEach((line) => console.error(`[db] ${line}`));
    process.exit(1);
  }

  if (!config.omdb.apiKey) {
    console.warn('[omdb] OMDB_API_KEY vacía: los endpoints que usan OMDb responderán 503 hasta que la configures.');
  }

  const app = createApp({ ...buildContainer(), getDatabaseStatus });

  const server = app.listen(config.port, () => {
    console.log(`[api] Escuchando en http://localhost:${config.port}/api  (health: /api/health)`);
  });

  const shutdown = (signal) => {
    console.log(`\n[api] ${signal} recibido, cerrando...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start();
