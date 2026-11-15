# Rotten Tomatoes — App de reseñas de películas y series

App móvil para ver, buscar y reseñar películas y series, con puntajes separados de **usuarios** y **críticos**.
Inspirada en Rotten Tomatoes

```
Rotten_Tomatoes/
├── Backend/    API REST (Node.js + Express + MongoDB)
└── Frontend/   App móvil (Ionic 9 + Angular 22 + Capacitor)
```

## Funcionalidades

- **Usuarios (CRUD):** registro, login con JWT, edición de perfil, eliminación de cuenta. El administrador gestiona todos los usuarios y asigna roles (usuario / crítico / admin).
- **Reseñas (CRUD):** opinión + puntaje (0 a 10, de 0.5 en 0.5) por película o serie. Una reseña por usuario y título.
- **Usuarios vs. críticos:** cada reseña cuenta según el rol de quien la escribe, y los promedios se calculan por separado.
- **Catálogo con filtros y orden:** por nombre, categorías, tipo, año, actor, rango de fechas de estreno y rango de puntaje. Orden por fecha, puntaje, título o popularidad (ascendente o descendente).
- **API externa (OMDb):** busca películas reales y las guarda en la base de datos propia la primera vez que se abren.
- **Explorar:** muestra por defecto las películas más populares, con barra de categorías. Al escribir, busca en OMDb.
- **Detalle:** carátula, sinopsis, fecha de estreno, duración, clasificación, géneros, dirección, reparto, país, premios, puntaje de usuarios, de críticos y de IMDb.

## Tecnologías

| Parte | Stack |
|---|---|
| Backend | Node.js 20+, Express 5, Mongoose 9, Zod (validación), JWT, bcryptjs, Helmet, CORS |
| Base de datos | MongoDB Atlas |
| API externa | OMDb |
| Frontend | Ionic 9, Angular 22 (standalone + signals), Capacitor (Android) |
| Despliegue | Render (backend) |

## Arquitectura

- **Backend en capas:** rutas → controladores → servicios → modelos, con inyección de dependencias manual (`container.js`).
- **Sin valores hardcodeados:** configuración en `.env` validado al inicio, y reglas de dominio (roles, rangos, límites) centralizadas en `Backend/src/config/constants.js`.
- **OMDb desacoplado:** cliente, mapper y proveedor separados, de modo que se puede cambiar de proveedor sin tocar los servicios.
- **Frontend:** componentes standalone, servicios reutilizables, interceptores y guards funcionales, y la URL de la API en un solo lugar (`src/environments`).

## Reglas de validación (backend y frontend)

| Campo | Regla |
|---|---|
| Correo | máx. 60 caracteres, formato `algo@dominio.ext` |
| Contraseña | de 8 a 16 caracteres |
| Usuario | de 3 a 20 caracteres (letras, números, `.` `_` `-`) |
| Opinión | de 3 a 500 caracteres |
| Búsquedas y filtros de texto | máx. 100 caracteres |

## Puesta en marcha

Requisitos: **Node.js 20+** y una base de datos en **MongoDB Atlas**.

### 1. Backend

```bash
cd Backend
npm install
cp .env.example .env     # en Windows: copy .env.example .env
```

Completa el `.env` (nunca lo subas a git):

| Variable | Para qué |
|---|---|
| `MONGODB_URI` | Cadena de conexión de Atlas |
| `MONGODB_DB_NAME` | Nombre de la base de datos |
| `JWT_SECRET` | Secreto largo y aleatorio para firmar los tokens |
| `OMDB_API_KEY` | Clave gratuita de <https://www.omdbapi.com/apikey.aspx> |
| `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administrador inicial (la clave de 8 a 16 caracteres) |
| `DNS_SERVERS` | Opcional: `8.8.8.8,1.1.1.1` si aparece `querySrv ECONNREFUSED` |

Comandos:

```bash
npm run seed:admin    # crea o restablece el administrador del .env
npm run seed:movies   # carga el catálogo inicial (~340 títulos desde OMDb)
npm run dev           # servidor con recarga automática (puerto 3000)
npm start             # producción
```

Comprobación: <http://localhost:3000/api/health> debe responder con `"database": "connected"`.

El catálogo inicial sale de `Backend/scripts/data/seed-movies.json`. Puedes agregar o quitar títulos y volver a ejecutar `npm run seed:movies`; los que ya existen se saltan.

Pruebas con Postman: importa `Backend/postman/RottenTomatoes.postman_collection.json` y ejecuta las carpetas en orden.

### 2. Frontend

```bash
cd Frontend
npm install
npm start             # http://localhost:4200
```

La URL de la API se configura en un solo lugar:

| Archivo | Uso |
|---|---|
| `src/environments/environment.ts` | Desarrollo (`http://localhost:3000/api`) |
| `src/environments/environment.prod.ts` | Producción y APK (URL del backend desplegado, terminada en `/api`) |

### 3. Generar la APK (Android)

Requisitos: Android Studio con JDK 21.

```bash
cd Frontend
npm run build
npx cap sync android
```

Luego en Android Studio abre `Frontend/android` y usa **Build → Generate APKs**.
La APK lleva el frontend empaquetado: cada cambio en `Frontend/` requiere generar una APK nueva. Los cambios solo del backend no la requieren.

## Despliegue del backend (Render)

1. Crea un **Web Service** conectado a este repositorio.
2. **Root Directory:** `Backend`. **Build Command:** `npm install`. **Start Command:** `npm start`.
3. Agrega las variables del `.env` en **Environment**.
4. En Atlas → **Network Access**, permite la IP de Render (por ejemplo `0.0.0.0/0`).

## Endpoints principales

Respuesta correcta: `{ "success": true, "data": ..., "meta": { "pagination": ... } }`
Error: `{ "success": false, "error": { "code", "message", "details?" } }`
Rutas protegidas: header `Authorization: Bearer <token>`.

| Grupo | Rutas |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Usuarios | `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/:id` |
| Películas | `GET /api/movies` (filtros, `sortBy=date\|rating\|title\|popularity`), `GET /api/movies/genres`, `GET /api/movies/:id`, `DELETE /api/movies/:id` |
| OMDb | `GET /api/movies/external/search`, `POST /api/movies/import`, `POST /api/movies/sync` |
| Reseñas | `GET/POST /api/movies/:id/reviews`, `PATCH/DELETE /api/reviews/:id` |
| Estado | `GET /api/health` |

## Roles

| Rol | Permisos |
|---|---|
| Usuario | Reseñar, editar y borrar sus propias reseñas y su cuenta |
| Crítico | Igual que usuario, pero su puntaje cuenta aparte como "críticos" |
| Admin | Todo lo anterior, gestionar usuarios y roles, y eliminar películas y reseñas |
