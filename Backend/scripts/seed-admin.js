/**
 * Crea (o promueve) el usuario administrador definido en el .env:
 *   ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD
 * Uso: npm run seed:admin
 */
import { config } from '../src/config/env.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { ROLES } from '../src/config/constants.js';
import { User } from '../src/models/user.model.js';
import { hashPassword } from '../src/utils/password.js';

const { username, email, password } = config.admin;

if (!username || !email || !password) {
  console.error('Define ADMIN_USERNAME, ADMIN_EMAIL y ADMIN_PASSWORD en el .env');
  process.exit(1);
}

try {
  await connectDatabase(config.mongo);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.role = ROLES.ADMIN;
    await existing.save();
    console.log(`El usuario ${existing.email} ya existía: ahora es admin.`);
  } else {
    await User.create({ username, email, password: await hashPassword(password), role: ROLES.ADMIN });
    console.log(`Administrador creado: ${email}`);
  }
} catch (error) {
  console.error(`No se pudo crear el administrador: ${error.message}`);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
