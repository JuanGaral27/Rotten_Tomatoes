/**
 * Genera postman/RottenTomatoes.postman_collection.json
 * Uso: node scripts/build-postman.mjs
 *
 * Las peticiones guardan solos los tokens e IDs en variables de la colección
 * (script "test" de cada petición), así que basta con ejecutarlas en orden.
 */
import { mkdirSync, writeFileSync } from 'node:fs';

const BEARER = (variable) => ({ type: 'bearer', bearer: [{ key: 'token', value: `{{${variable}}}`, type: 'string' }] });

// Script "test": asserts + guardado de variables.
const tests = ({ status, save = {}, extra = [] }) => ({
  listen: 'test',
  script: {
    type: 'text/javascript',
    exec: [
      `pm.test('Status ${status}', () => pm.response.to.have.status(${status}));`,
      ...(status === 204 ? [] : ['const body = pm.response.json();']),
      ...Object.entries(save).map(([variable, path]) => `pm.collectionVariables.set('${variable}', ${path});`),
      ...extra,
    ],
  },
});

const request = ({ name, method, path, query, body, auth, status, save, extra, description }) => ({
  name,
  event: [tests({ status, save, extra })],
  request: {
    method,
    description,
    ...(auth ? { auth: BEARER(auth) } : { auth: { type: 'noauth' } }),
    header: body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
    ...(body && { body: { mode: 'raw', raw: JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } }),
    url: {
      raw: `{{baseUrl}}${path}${query ? '?' + query.map((q) => `${q.key}=${q.value}`).join('&') : ''}`,
      host: ['{{baseUrl}}'],
      path: path.split('/').filter(Boolean),
      ...(query && { query: query.map((q) => ({ ...q, disabled: q.disabled ?? false })) }),
    },
  },
});

const q = (key, value, disabled = false) => ({ key, value, disabled });

const folders = [
  {
    name: '0. Salud',
    item: [request({ name: 'Health (¿conecta a MongoDB?)', method: 'GET', path: '/health', status: 200,
      extra: ["pm.test('BD conectada', () => pm.expect(body.data.database).to.eql('connected'));"] })],
  },
  {
    name: '1. Auth y Usuarios (CRUD)',
    item: [
      request({ name: 'Registro (usuario normal)', method: 'POST', path: '/auth/register', status: 201,
        body: { username: 'cinefilo', email: 'cinefilo@example.com', password: 'Password123' },
        save: { userToken: 'body.data.token', userId: 'body.data.user.id' },
        description: 'Si ya existe, devuelve 409: usa "Login (usuario)".' }),
      request({ name: 'Login (usuario)', method: 'POST', path: '/auth/login', status: 200,
        body: { email: 'cinefilo@example.com', password: 'Password123' },
        save: { userToken: 'body.data.token', userId: 'body.data.user.id' } }),
      request({ name: 'Login (ADMIN) — antes corre: npm run seed:admin', method: 'POST', path: '/auth/login', status: 200,
        body: { email: 'admin@example.com', password: 'Admin12345' }, save: { adminToken: 'body.data.token' } }),
      request({ name: 'Mi perfil (/auth/me)', method: 'GET', path: '/auth/me', auth: 'userToken', status: 200 }),
      request({ name: 'ADMIN: crear crítico', method: 'POST', path: '/users', auth: 'adminToken', status: 201,
        body: { username: 'critico1', email: 'critico1@example.com', password: 'Password123', role: 'critic' },
        save: { criticId: 'body.data.id' }, description: 'Si ya existe, devuelve 409: usa "Login (crítico)".' }),
      request({ name: 'Login (crítico)', method: 'POST', path: '/auth/login', status: 200,
        body: { email: 'critico1@example.com', password: 'Password123' }, save: { criticToken: 'body.data.token', criticId: 'body.data.user.id' } }),
      request({ name: 'ADMIN: listar usuarios', method: 'GET', path: '/users', auth: 'adminToken', status: 200,
        query: [q('page', '1'), q('limit', '10'), q('role', 'critic', true), q('q', 'cine', true)] }),
      request({ name: 'Ver usuario por id', method: 'GET', path: '/users/{{userId}}', auth: 'userToken', status: 200 }),
      request({ name: 'Editar usuario', method: 'PATCH', path: '/users/{{userId}}', auth: 'userToken', status: 200,
        body: { username: 'cinefilo_pro' } }),
    ],
  },
  {
    name: '2. Películas — API externa (OMDb) → BD',
    item: [
      request({ name: 'Buscar en OMDb (no guarda)', method: 'GET', path: '/movies/external/search', auth: 'userToken', status: 200,
        query: [q('q', 'batman'), q('type', 'movie', true), q('year', '2008', true), q('page', '1')],
        save: { externalImdbId: 'body.data[0].imdbId' } }),
      request({ name: 'Importar por imdbId', method: 'POST', path: '/movies/import', auth: 'userToken', status: 201,
        body: { imdbId: 'tt0468569' }, save: { movieId: 'body.data.id' },
        extra: ["pm.test('Trae sinopsis, actores y carátula', () => { const m = body.data; pm.expect(m.plot).to.be.a('string'); pm.expect(m.actors).to.be.an('array').that.is.not.empty; pm.expect(m.poster).to.be.a('string'); });"],
        description: '201 si se guardó ahora; 200 si ya estaba en tu BD (meta.created).' }),
      request({ name: 'Importar por título', method: 'POST', path: '/movies/import', auth: 'userToken', status: 201,
        body: { title: 'Inception', year: 2010, type: 'movie' }, save: { movieId2: 'body.data.id' } }),
      request({ name: 'Obtener por imdbId (importa si falta)', method: 'GET', path: '/movies/imdb/tt0133093', auth: 'userToken', status: 201 }),
      request({ name: 'ADMIN: sync masivo de una búsqueda', method: 'POST', path: '/movies/sync', auth: 'adminToken', status: 200,
        body: { q: 'matrix', page: 1 } }),
    ],
  },
  {
    name: '3. Películas — Catálogo, filtros y sorting',
    item: [
      request({ name: 'Listar (default: por fecha desc)', method: 'GET', path: '/movies', status: 200, query: [q('page', '1'), q('limit', '10')] }),
      request({ name: 'Buscar por nombre', method: 'GET', path: '/movies', status: 200, query: [q('q', 'dark')] }),
      request({ name: 'Filtrar por categorías (acción o drama)', method: 'GET', path: '/movies', status: 200, query: [q('genre', 'Action,Drama')] }),
      request({ name: 'Filtrar por tipo (serie) y año', method: 'GET', path: '/movies', status: 200, query: [q('type', 'series'), q('year', '2008', true)] }),
      request({ name: 'Filtrar por actor', method: 'GET', path: '/movies', status: 200, query: [q('actor', 'Ledger')] }),
      request({ name: 'Filtrar por rango de fecha de estreno', method: 'GET', path: '/movies', status: 200,
        query: [q('releasedFrom', '2005-01-01'), q('releasedTo', '2012-12-31')] }),
      request({ name: 'Filtrar por puntaje (IMDb ≥ 8)', method: 'GET', path: '/movies', status: 200,
        query: [q('minRating', '8'), q('ratingSource', 'imdb')] }),
      request({ name: 'Sorting por PUNTAJE de usuarios (desc)', method: 'GET', path: '/movies', status: 200,
        query: [q('sortBy', 'rating'), q('ratingSource', 'user'), q('order', 'desc')] }),
      request({ name: 'Sorting por PUNTAJE de críticos (desc)', method: 'GET', path: '/movies', status: 200,
        query: [q('sortBy', 'rating'), q('ratingSource', 'critic'), q('order', 'desc')] }),
      request({ name: 'Sorting por FECHA (asc)', method: 'GET', path: '/movies', status: 200, query: [q('sortBy', 'date'), q('order', 'asc')] }),
      request({ name: 'Combinado: drama + ≥7 usuarios + por puntaje', method: 'GET', path: '/movies', status: 200,
        query: [q('genre', 'Drama'), q('minRating', '7'), q('ratingSource', 'user'), q('sortBy', 'rating')] }),
      request({ name: 'Listar categorías disponibles', method: 'GET', path: '/movies/genres', status: 200 }),
      request({ name: 'Detalle de película (puntajes usuarios vs críticos)', method: 'GET', path: '/movies/{{movieId}}', status: 200,
        extra: ["pm.test('Separa rating de usuarios y críticos', () => { pm.expect(body.data.ratings).to.have.keys('user', 'critic'); });"] }),
      request({ name: 'ADMIN: eliminar película (y sus reseñas)', method: 'DELETE', path: '/movies/{{movieId2}}', auth: 'adminToken', status: 204 }),
    ],
  },
  {
    name: '4. Comentarios / Reseñas (CRUD)',
    item: [
      request({ name: 'Crear reseña (como usuario)', method: 'POST', path: '/movies/{{movieId}}/reviews', auth: 'userToken', status: 201,
        body: { rating: 8.5, comment: 'Gran película, el Joker es inolvidable.' },
        save: { reviewId: 'body.data.id' }, extra: ["pm.test('reviewerType user', () => pm.expect(body.data.reviewerType).to.eql('user'));"] }),
      request({ name: 'Crear reseña (como crítico)', method: 'POST', path: '/movies/{{movieId}}/reviews', auth: 'criticToken', status: 201,
        body: { rating: 9.5, comment: 'Dirección y fotografía impecables.' },
        save: { criticReviewId: 'body.data.id' }, extra: ["pm.test('reviewerType critic', () => pm.expect(body.data.reviewerType).to.eql('critic'));"] }),
      request({ name: 'Listar reseñas de la película', method: 'GET', path: '/movies/{{movieId}}/reviews', status: 200,
        query: [q('reviewerType', 'critic', true), q('sortBy', 'rating'), q('order', 'desc'), q('page', '1'), q('limit', '10')] }),
      request({ name: 'Ver reseña por id', method: 'GET', path: '/reviews/{{reviewId}}', status: 200 }),
      request({ name: 'Reseñas de un usuario', method: 'GET', path: '/users/{{userId}}/reviews', status: 200 }),
      request({ name: 'Editar reseña (dueño o admin)', method: 'PATCH', path: '/reviews/{{reviewId}}', auth: 'userToken', status: 200,
        body: { rating: 9, comment: 'Después de verla otra vez, sube de nota.' } }),
      request({ name: 'Eliminar reseña (dueño o admin)', method: 'DELETE', path: '/reviews/{{criticReviewId}}', auth: 'criticToken', status: 204 }),
    ],
  },
  {
    name: '5. Casos de error (deben fallar bien)',
    item: [
      request({ name: 'Sin token → 401', method: 'GET', path: '/users', status: 401 }),
      request({ name: 'Usuario normal en ruta admin → 403', method: 'GET', path: '/users', auth: 'userToken', status: 403 }),
      request({ name: 'Registro inválido → 400 con detalles', method: 'POST', path: '/auth/register', status: 400, body: { username: 'a', email: 'x', password: '1' } }),
      request({ name: 'Puntaje inválido (11) → 400', method: 'POST', path: '/movies/{{movieId}}/reviews', auth: 'userToken', status: 400, body: { rating: 11, comment: 'fuera de rango' } }),
      request({ name: 'Reseña duplicada → 409', method: 'POST', path: '/movies/{{movieId}}/reviews', auth: 'userToken', status: 409, body: { rating: 7, comment: 'segunda reseña' } }),
      request({ name: 'Película inexistente → 404', method: 'GET', path: '/movies/507f1f77bcf86cd799439011', status: 404 }),
    ],
  },
  {
    name: '6. Operaciones destructivas (ejecutar al final)',
    item: [
      request({ name: 'ADMIN: cambiar rol a crítico', method: 'PATCH', path: '/users/{{userId}}', auth: 'adminToken', status: 200,
        body: { role: 'critic' }, description: 'Sus reseñas pasan a contar como "crítico" y los promedios se recalculan.' }),
      request({ name: 'ADMIN: devolver rol a usuario', method: 'PATCH', path: '/users/{{userId}}', auth: 'adminToken', status: 200,
        body: { role: 'user' } }),
      request({ name: 'Eliminar usuario (¡borra también sus reseñas!)', method: 'DELETE', path: '/users/{{userId}}', auth: 'userToken', status: 204 }),
    ],
  },
];

const collection = {
  info: {
    name: 'Rotten Tomatoes — Backend',
    description: 'Colección de pruebas. Ejecuta las carpetas en orden (0 → 5). Los tokens e IDs se guardan solos.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000/api' },
    ...['userToken', 'adminToken', 'criticToken', 'userId', 'criticId', 'movieId', 'movieId2', 'reviewId', 'criticReviewId', 'externalImdbId'].map((key) => ({ key, value: '' })),
  ],
  item: folders,
};

mkdirSync(new URL('../postman/', import.meta.url), { recursive: true });
writeFileSync(new URL('../postman/RottenTomatoes.postman_collection.json', import.meta.url), JSON.stringify(collection, null, 2) + '\n');
console.log('Colección generada en postman/RottenTomatoes.postman_collection.json');
