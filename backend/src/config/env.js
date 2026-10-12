require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim()),
  trustProxy: process.env.TRUST_PROXY === 'true',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
};

if (!env.jwtSecret || env.jwtSecret.length < 16) {
  throw new Error('JWT_SECRET no está definido o es demasiado corto (mínimo 16 caracteres). Revisa tu archivo .env');
}

module.exports = env;
