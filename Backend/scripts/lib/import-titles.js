// Códigos de error que no tiene sentido reintentar con el siguiente título.
const FATAL_CODES = new Set(['OMDB_NOT_CONFIGURED', 'OMDB_INVALID_API_KEY', 'OMDB_RATE_LIMIT']);

/**
 * Importa una lista de títulos usando MovieService (API externa -> MongoDB).
 * - Idempotente: los que ya existen no se duplican.
 * - Va en tandas pequeñas para no saturar la API externa.
 * - Se detiene si el problema es la key o el límite diario (no un título suelto).
 *
 * @returns {{ created: string[], existing: string[], failed: {title, reason}[], aborted: string|null }}
 */
export const importTitles = async ({ movieService, titles, concurrency = 3, onProgress }) => {
  const summary = { created: [], existing: [], failed: [], aborted: null };
  let done = 0;

  for (let start = 0; start < titles.length && !summary.aborted; start += concurrency) {
    const batch = titles.slice(start, start + concurrency);
    const outcomes = await Promise.allSettled(batch.map((item) => movieService.importByTitle(item)));

    outcomes.forEach((outcome, index) => {
      const { title } = batch[index];
      done += 1;

      if (outcome.status === 'fulfilled') {
        (outcome.value.created ? summary.created : summary.existing).push(title);
      } else {
        const reason = outcome.reason?.message ?? 'Error desconocido';
        summary.failed.push({ title, reason });
        if (FATAL_CODES.has(outcome.reason?.code)) summary.aborted = reason;
      }
      onProgress?.({ done, total: titles.length, title, status: outcome.status });
    });
  }

  return summary;
};
