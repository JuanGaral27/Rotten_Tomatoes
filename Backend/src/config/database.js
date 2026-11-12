import dns from 'node:dns';
import mongoose from 'mongoose';

const READY_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export const connectDatabase = async ({ uri, dbName, dnsServers = [] }) => {
  // Si se configuró, Node usará estos DNS para resolver el cluster de Atlas.
  if (dnsServers.length > 0) dns.setServers(dnsServers);

  mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB desconectado'));
  mongoose.connection.on('reconnected', () => console.log('[db] MongoDB reconectado'));

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10_000 });
  console.log(`[db] MongoDB conectado (base de datos: "${mongoose.connection.name}")`);
};

export const disconnectDatabase = () => mongoose.disconnect();

export const getDatabaseStatus = () => READY_STATES[mongoose.connection.readyState] ?? 'unknown';

/** Traduce los errores de conexión más comunes a una guía clara de qué revisar. */
export const describeConnectionError = (error) => {
  const message = error?.message ?? '';

  if (/querySrv|ENOTFOUND|ECONNREFUSED.*_mongodb/i.test(message)) {
    return [
      'Tu equipo no pudo resolver la dirección del cluster (problema de DNS, no de credenciales).',
      'Prueba en este orden:',
      '  1) En .env agrega: DNS_SERVERS=8.8.8.8,1.1.1.1  y reinicia.',
      '  2) Cambia el DNS de tu red/Windows a 8.8.8.8 y 1.1.1.1, o prueba con otra red (datos del celular).',
      '  3) Desactiva VPN/antivirus que filtre DNS.',
      '  4) Usa la cadena "standard" de Atlas (mongodb://...) en vez de mongodb+srv:// (ver README).',
    ];
  }
  if (/bad auth|authentication failed/i.test(message)) {
    return ['Usuario o contraseña incorrectos (revisa MONGODB_URI; si la clave tiene símbolos, codifícala con encodeURIComponent).'];
  }
  if (/whitelist|ReplicaSetNoPrimary|Server selection timed out|ETIMEDOUT/i.test(message)) {
    return ['No se alcanzó el cluster: en Atlas > Network Access agrega tu IP o 0.0.0.0/0 (Allow access from anywhere).'];
  }
  return ['Revisa MONGODB_URI en .env y el estado del cluster en Atlas.'];
};
