# Rotten Tomatoes — Backend

API REST con **Node.js + Express + MongoDB (Mongoose)**. Usa **OMDb** como fuente externa de películas/series y las guarda en tu propia base de datos la primera vez que se piden.

```
Rotten Tomatoes/
├── Backend/   ← esta carpeta
└── Frontend/  ← (Ionic + Angular, viene después)
```

## 1. Puesta en marcha

Requisitos: **Node.js 20+**.

```bash
cd Backend
npm install
```

Edita `.env` (hay una plantilla en `.env.example`):

| Variable | Para qué |
|---|---|
| `MONGODB_URI` | Tu cadena de conexión de Atlas |
| `MONGODB_DB_NAME` | Nombre de la base de datos (`rotten_tomatoes`) |
| `JWT_SECRET` | Secreto para firmar los tokens (ya hay uno generado) |
| `OMDB_API_KEY` | **Pendiente: pónla tú** (gratis, ver abajo) |
| `ADMIN_*` | Credenciales del admin inicial |

### API key de OMDb (gratis, 1 minuto)
1. Entra a <https://www.omdbapi.com/apikey.aspx> y elige **FREE** (1000 peticiones/día).
2. Te llega un correo con la key; **actívala con el enlace del correo**.
3. Pégala en `OMDB_API_KEY=` del `.env`.

Sin la key el servidor arranca igual: usuarios, comentarios y BD funcionan; solo los endpoints de OMDb responden `503 OMDB_NOT_CONFIGURED`.

### Atlas: que tu IP pueda conectarse
Si el arranque dice *"No se pudo conectar a MongoDB"*: en Atlas → **Network Access** → **Add IP Address** → tu IP actual (o `0.0.0.0/0` solo para desarrollo).

### Si sale `querySrv ECONNREFUSED` / `ENOTFOUND`
Es un problema de **DNS de tu red** (no de usuario, clave ni IP). Soluciones, en orden:
1. En `.env`: `DNS_SERVERS=8.8.8.8,1.1.1.1` y reinicia (ya viene así por defecto).
2. Cambia el DNS de Windows/Wi‑Fi a `8.8.8.8` y `1.1.1.1`, o prueba con otra red (hotspot del celular). Desactiva VPN.
3. Usa la cadena *standard* (sin SRV): Atlas → **Connect** → **Drivers** → elige Node.js con versión **2.2.12 o posterior** → copia el link que empieza con `mongodb://` (con 3 hosts) y pégalo en `MONGODB_URI`.

En Atlas → **Network Access** la entrada debe ser `0.0.0.0/0` (*Allow access from anywhere*). Con `Database Access` basta un usuario con rol *Read and write to any database*.

### Arrancar

```bash
npm run seed:admin   # crea el admin del .env (una vez)
npm run dev          # servidor con recarga automática
```

Comprueba la conexión a la BD: <http://localhost:3000/api/health> → `"database": "connected"`.

## 2. Probar con Postman

1. Postman → **Import** → `postman/RottenTomatoes.postman_collection.json`.
2. Ejecuta las carpetas **en orden (0 → 6)**. Los tokens y los IDs se guardan solos en variables de la colección y cada petición trae sus `tests`.
3. También puedes usar **Run collection** (la carpeta 2 necesita `OMDB_API_KEY`).

La colección se genera con `npm run postman:build`.

## 3. Endpoints

Respuesta exitosa: `{ "success": true, "data": ..., "meta": { "pagination": ... } }`  
Error: `{ "success": false, "error": { "code", "message", "details?" } }`  
Rutas protegidas: header `Authorization: Bearer <token>`.

### Auth
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/auth/register` | Público (siempre rol `user`) |
| POST | `/api/auth/login` | Público |
| GET | `/api/auth/me` | Autenticado |

### Usuarios (CRUD)
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/users` | Admin (puede asignar rol `user` / `critic` / `admin`) |
| GET | `/api/users?page&limit&role&q` | Admin |
| GET | `/api/users/:id` | Dueño o admin |
| PATCH | `/api/users/:id` | Dueño o admin (cambiar `role`: solo admin) |
| DELETE | `/api/users/:id` | Dueño o admin (borra sus reseñas) |
| GET | `/api/users/:id/reviews` | Público |

### Películas / series
| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/movies` | Público — filtros y sorting (abajo) |
| GET | `/api/movies/genres` | Público — categorías disponibles |
| GET | `/api/movies/:id` | Público — detalle completo |
| GET | `/api/movies/external/search?q&type&year&page` | Autenticado — busca en OMDb, **no guarda** |
| POST | `/api/movies/import` | Autenticado — `{ "imdbId" }` o `{ "title", "year?", "type?" }` |
| GET | `/api/movies/imdb/:imdbId` | Autenticado — devuelve la de tu BD o la importa si falta |
| POST | `/api/movies/sync` | Admin — importa en bloque los resultados de una búsqueda |
| DELETE | `/api/movies/:id` | Admin (borra sus reseñas) |

**Filtros y orden de `GET /api/movies`** (todos opcionales y combinables):

| Parámetro | Ejemplo | Descripción |
|---|---|---|
| `q` | `q=dark` | Nombre (parcial, sin distinguir mayúsculas) |
| `genre` | `genre=Action,Drama` | Categorías (coincide con cualquiera) |
| `type` | `type=series` | `movie` · `series` · `episode` |
| `actor` | `actor=ledger` | Actor |
| `year` | `year=2008` | Año |
| `releasedFrom` / `releasedTo` | `2005-01-01` | Rango de fecha de estreno |
| `minRating` / `maxRating` | `8` | Rango de puntaje (0–10) |
| `ratingSource` | `user` · `critic` · `imdb` | **De dónde sale el puntaje** (filtro y orden). Default `imdb` |
| `sortBy` | `date` · `rating` · `title` | Ordenar por fecha o puntaje (o título) |
| `order` | `asc` · `desc` | Default: fecha/puntaje `desc`, título `asc` |
| `page`, `limit` | `1`, `10` | Paginación (límite máx. 50) |

### Reseñas (comentario + puntaje)
| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/movies/:movieId/reviews` | Autenticado — `{ "rating": 8.5, "comment": "..." }` |
| GET | `/api/movies/:movieId/reviews?reviewerType&sortBy&order` | Público |
| GET | `/api/reviews/:id` | Público |
| PATCH | `/api/reviews/:id` | Dueño o admin |
| DELETE | `/api/reviews/:id` | Dueño o admin |

Reglas: puntaje de **0 a 10 en pasos de 0.5**, comentario de 3 a 2000 caracteres, **una reseña por usuario y película**.

### Usuarios normales vs. críticos
- Cada usuario tiene un `role`: `user`, `critic` o `admin`. Solo un **admin** asigna el rol `critic`.
- Cada reseña guarda su `reviewerType` (`user` o `critic`) según el rol de quien la escribe.
- Cada película expone los dos promedios por separado:
  ```json
  "ratings": {
    "user":   { "average": 7.5, "count": 12 },
    "critic": { "average": 8.9, "count": 3 }
  },
  "externalRatings": { "imdb": { "rating": 8.8, "votes": 2700000 }, "metascore": 74, "rottenTomatoes": 87 }
  ```
- Los promedios se recalculan solos al crear/editar/borrar reseñas, al borrar un usuario o al cambiarle el rol.

## 4. Arquitectura (desacoplada)

```
src/
├── config/        env.js (único lugar que lee process.env), constants.js, database.js
├── models/        Esquemas de Mongoose (User, Movie, Review)
├── validators/    Esquemas Zod de entrada (params / query / body)
├── queries/       Traduce filtros de la URL → consulta de MongoDB
├── services/      Lógica de negocio (sin Express)
├── controllers/   Capa HTTP delgada: toma req.valid → llama al servicio → responde
├── routes/        Une URL + middlewares + controlador
├── middlewares/   validate, authenticate, authorize, errorHandler, notFound
├── integrations/omdb/  client (HTTP) · mapper (OMDb → nuestro formato) · provider (contrato)
├── utils/         ApiError, response, pagination, password, permissions...
├── container.js   Inyección de dependencias: aquí se conectan las piezas
├── app.js         Construye Express (no escucha puertos ni toca la BD)
└── server.js      Conecta a MongoDB y arranca
```

- **Sin valores hardcodeados**: configuración en `.env` validado al inicio; reglas de dominio (rangos de puntaje, roles, límites) en `config/constants.js`.
- **Cambiar de API externa** (p. ej. TMDB): escribe un proveedor con `getByImdbId`, `getByTitle` y `search` y cámbialo en `container.js`. Servicios y controladores no se tocan.
- Los servicios reciben sus dependencias por constructor, así que se pueden probar con piezas falsas (`buildContainer({ movieProvider })`).

## 5. Seguridad

- Contraseñas con **bcrypt**; nunca se devuelven en las respuestas.
- Tokens **JWT**; el usuario se relee de la BD en cada petición, así que un cambio de rol o un borrado surte efecto al instante.
- El registro público **ignora** el campo `role`.
- `.env` está en `.gitignore`: **no lo subas a GitHub**.
