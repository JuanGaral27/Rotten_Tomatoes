/**
 * Carga el catálogo inicial: trae de OMDb los títulos de scripts/data/seed-movies.json
 * y los guarda en tu MongoDB (los que ya existen se saltan).
 *
 * Uso:  npm run seed:movies
 * Para usar otra lista: edita scripts/data/seed-movies.json  (title, year, type).
 */
import { readFile } from 'node:fs/promises';
import { config } from '../src/config/env.js';
import { connectDatabase, describeConnectionError, disconnectDatabase } from '../src/config/database.js';
import { buildContainer } from '../src/container.js';
import { importTitles } from './lib/import-titles.js';

if (!config.omdb.apiKey) {
  console.error('Falta OMDB_API_KEY en el .env (consíguela gratis en https://www.omdbapi.com/apikey.aspx).');
  process.exit(1);
}

const titles = JSON.parse(await readFile(new URL('./data/seed-movies.json', import.meta.url), 'utf8'));

try {
  await connectDatabase(config.mongo);
} catch (error) {
  console.error(`No se pudo conectar a MongoDB: ${error.message}`);
  describeConnectionError(error).forEach((line) => console.error(line));
  process.exit(1);
}

try {
  console.log(`Importando ${titles.length} títulos desde OMDb...`);
  const { movieService } = buildContainer().services;

  const summary = await importTitles({
    movieService,
    titles,
    onProgress: ({ done, total, title, status }) =>
      console.log(`  [${String(done).padStart(2)}/${total}] ${status === 'fulfilled' ? 'ok ' : 'FALLÓ'} ${title}`),
  });

  console.log(`\nNuevas: ${summary.created.length} | Ya existían: ${summary.existing.length} | Fallidas: ${summary.failed.length}`);
  summary.failed.forEach(({ title, reason }) => console.log(`  - ${title}: ${reason}`));
  if (summary.aborted) {
    console.error(`\nSe detuvo antes de terminar: ${summary.aborted}`);
    process.exitCode = 1;
  }
} finally {
  await disconnectDatabase();
}
