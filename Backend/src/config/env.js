import 'dotenv/config';
import { z } from 'zod';

// Un valor vacío en el .env (ej: ADMIN_EMAIL=) se trata como "no definido".
const optional = (schema) => z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI es obligatoria'),
  MONGODB_DB_NAME: z.string().min(1).default('rotten_tomatoes'),
  // Opcional: servidores DNS para resolver el cluster (mongodb+srv), ej: "8.8.8.8,1.1.1.1".
  // Útil cuando el DNS de tu red/ISP falla con "querySrv ECONNREFUSED".
  DNS_SERVERS: optional(z.string()),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().min(1).default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  // Opcional al arrancar: así puedes probar usuarios/comentarios/BD sin la key.
  OMDB_API_KEY: z.string().default(''),
  OMDB_BASE_URL: z.url().default('https://www.omdbapi.com/'),
  OMDB_TIMEOUT_MS: z.coerce.number().int().min(1000).default(8000),

  CORS_ORIGIN: z.string().default('*'),

  ADMIN_USERNAME: optional(z.string()),
  ADMIN_EMAIL: optional(z.string()),
  ADMIN_PASSWORD: optional(z.string()),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const lines = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
  console.error(`Variables de entorno inválidas:\n${lines.join('\n')}`);
  console.error('Revisa tu archivo .env (usa .env.example como guía).');
  process.exit(1);
}

const env = result.data;

const parseList = (raw) => (raw ? raw.split(',').map((item) => item.trim()).filter(Boolean) : []);

const parseOrigins = (raw) =>
  raw.trim() === '*' ? '*' : raw.split(',').map((origin) => origin.trim()).filter(Boolean);

export const config = Object.freeze({
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,
  mongo: Object.freeze({
    uri: env.MONGODB_URI,
    dbName: env.MONGODB_DB_NAME,
    dnsServers: parseList(env.DNS_SERVERS),
  }),
  jwt: Object.freeze({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN }),
  bcrypt: Object.freeze({ saltRounds: env.BCRYPT_SALT_ROUNDS }),
  omdb: Object.freeze({
    apiKey: env.OMDB_API_KEY,
    baseUrl: env.OMDB_BASE_URL,
    timeoutMs: env.OMDB_TIMEOUT_MS,
  }),
  cors: Object.freeze({ origin: parseOrigins(env.CORS_ORIGIN) }),
  admin: Object.freeze({
    username: env.ADMIN_USERNAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  }),
});
